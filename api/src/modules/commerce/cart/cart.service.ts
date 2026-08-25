import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

const HYDRATED_SELECT = {
  id: true,
  variantId: true,
  qty: true,
  variant: {
    select: {
      sku: true,
      priceMinor: true,
      isActive: true,
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          subtitle: true,
          basePriceMinor: true,
          currency: true,
          status: true,
          images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } },
        },
      },
    },
  },
} as const;

export interface HydratedCart {
  items: {
    id: string;
    variantId: string;
    productId: string;
    slug: string;
    title: string;
    subtitle: string | null;
    imageUrl: string | null;
    sku: string;
    unitPriceMinor: number;
    currency: string;
    qty: number;
    lineTotalMinor: number;
    available: number;
  }[];
  itemCount: number;
  subtotalMinor: number;
  currency: string;
}

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService
  ) {}

  async getHydrated(cartToken: string): Promise<HydratedCart> {
    const rows = await this.prisma.cartItem.findMany({
      where: { cartToken },
      orderBy: { createdAt: "asc" },
      select: HYDRATED_SELECT,
    });

    const availability = await this.inventory.availability(
      rows.map((r) => r.variantId)
    );

    let subtotal = 0;
    const items = rows
      .filter((r) => r.variant.isActive && r.variant.product.status === "ACTIVE")
      .map((r) => {
        const p = r.variant.product;
        const unit = r.variant.priceMinor ?? p.basePriceMinor;
        subtotal += unit * r.qty;
        return {
          id: r.id,
          variantId: r.variantId,
          productId: p.id,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          imageUrl: p.images[0]?.url ?? null,
          sku: r.variant.sku,
          unitPriceMinor: unit,
          currency: p.currency,
          qty: r.qty,
          lineTotalMinor: unit * r.qty,
          available: availability[r.variantId] ?? 0,
        };
      });

    return {
      items,
      itemCount: items.reduce((acc, i) => acc + i.qty, 0),
      subtotalMinor: subtotal,
      currency: items[0]?.currency ?? "INR",
    };
  }

  async addItem(cartToken: string, userId: string | null, variantId: string, qty: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { status: true } } },
    });
    if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
      throw new NotFoundException("This piece is not purchasable");
    }

    await this.prisma.cartItem.upsert({
      where: { cartToken_variantId: { cartToken, variantId } },
      update: { qty: { increment: qty }, userId },
      create: { cartToken, userId, productId: variant.productId, variantId, qty },
    });
    return this.getHydrated(cartToken);
  }

  async updateQty(cartToken: string, itemId: string, qty: number) {
    const existing = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartToken },
    });
    if (!existing) throw new NotFoundException("Cart item not found");

    if (qty === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
    }
    return this.getHydrated(cartToken);
  }

  async removeItem(cartToken: string, itemId: string): Promise<void> {
    const existing = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartToken },
    });
    if (!existing) throw new NotFoundException("Cart item not found");
    await this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clear(cartToken: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({ where: { cartToken } });
  }

  async mergeGuestCart(guestToken: string, userId: string): Promise<void> {
    if (!guestToken) throw new BadRequestException("cartToken required");

    const guestItems = await this.prisma.cartItem.findMany({
      where: { cartToken: guestToken },
    });

    for (const gi of guestItems) {
      await this.prisma.cartItem.upsert({
        where: {
          cartToken_variantId: { cartToken: guestToken, variantId: gi.variantId },
        },
        update: { userId },
        create: {
          cartToken: guestToken,
          userId,
          productId: gi.productId,
          variantId: gi.variantId,
          qty: gi.qty,
        },
      });
    }
  }
}
