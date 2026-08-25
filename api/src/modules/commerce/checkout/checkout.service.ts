import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../../../shared/prisma.service";
import { CartService } from "../cart/cart.service";
import { InventoryService } from "../inventory/inventory.service";
import { MockGateway } from "../payments/mock.gateway";
import { RazorpayGateway } from "../payments/razorpay.gateway";
import { FlatRateShippingProvider } from "../shipping/flat-rate.provider";
import type { CreateCheckoutDto } from "./dto/create-checkout.dto";

const FREE_SHIPPING_THRESHOLD_MINOR = 200000;
const FLAT_SHIPPING_MINOR = 19900;

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly inventory: InventoryService,
    private readonly razorpay: RazorpayGateway,
    private readonly mockGateway: MockGateway,
    private readonly shipping: FlatRateShippingProvider
  ) {}

  static computeTotals(subtotalMinor: number) {
    const shippingMinor =
      subtotalMinor >= FREE_SHIPPING_THRESHOLD_MINOR ? 0 : FLAT_SHIPPING_MINOR;
    return {
      subtotalMinor,
      shippingMinor,
      taxMinor: 0,
      totalMinor: subtotalMinor + shippingMinor,
    };
  }

  async startCheckout(params: {
    cartToken: string;
    dto: CreateCheckoutDto;
    user?: { sub: string; email: string };
  }) {
    const { cartToken, dto } = params;
    const userId = params.user?.sub ?? null;

    const cart = await this.cartService.getHydrated(cartToken);
    if (cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    for (const item of cart.items) {
      if (item.qty > item.available) {
        throw new ConflictException(
          `Only ${item.available} unit(s) left of "${item.title}"`
        );
      }
    }

    let addressSnapshot: Record<string, unknown>;
    if (userId && dto.addressId) {
      const saved = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId },
      });
      if (!saved) throw new NotFoundException("Address not found");
      addressSnapshot = saved;
    } else if (dto.address) {
      const a = dto.address;
      addressSnapshot = {
        line1: a.line1,
        line2: a.line2 ?? null,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        country: a.country ?? "India",
      };
      if (userId && dto.saveAddress) {
        await this.prisma.address.create({
          data: { ...a, userId },
        });
      }
    } else {
      throw new BadRequestException("Provide addressId or address");
    }

    const totals = CheckoutService.computeTotals(cart.subtotalMinor);
    const orderNumber = this.generateOrderNumber();
    const reservationRef = `order:${orderNumber}`;

    for (const item of cart.items) {
      await this.inventory.reserve(item.variantId, item.qty, reservationRef);
    }

    const order = await this.prisma.order.create({
      data: {
        number: orderNumber,
        userId,
        cartToken,
        status: OrderStatus.PENDING,
        subtotalMinor: totals.subtotalMinor,
        shippingMinor: totals.shippingMinor,
        taxMinor: totals.taxMinor,
        totalMinor: totals.totalMinor,
        currency: cart.currency,
        addressJson: addressSnapshot as Prisma.InputJsonValue,
        lines: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            titleSnapshot: i.title,
            skuSnapshot: i.sku,
            imageSnapshot: i.imageUrl,
            qty: i.qty,
            priceMinor: i.unitPriceMinor,
            totalMinor: i.lineTotalMinor,
          })),
        },
      },
      include: { lines: true },
    });

    let intent;
    try {
      intent = await this.razorpay.createPaymentIntent({
        orderNumber,
        amountMinor: totals.totalMinor,
        currency: cart.currency,
        customerEmail: params.user?.email,
      });
    } catch {
      intent = await this.mockGateway.createPaymentIntent({
        orderNumber,
        amountMinor: totals.totalMinor,
        currency: cart.currency,
      });
    }

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: intent.provider,
        providerRef: intent.providerRef,
        amountMinor: intent.amountMinor,
        currency: intent.currency,
        status: PaymentStatus.CREATED,
      },
    });

    return {
      order: {
        number: order.number,
        status: order.status,
        subtotalMinor: order.subtotalMinor,
        shippingMinor: order.shippingMinor,
        totalMinor: order.totalMinor,
        currency: order.currency,
      },
      payment: {
        provider: intent.provider,
        providerRef: intent.providerRef,
        amountMinor: intent.amountMinor,
      },
    };
  }

  private generateOrderNumber(): string {
    return `KLK-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
      .toString("hex")
      .toUpperCase()}`;
  }
}
