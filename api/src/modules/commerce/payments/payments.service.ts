import {
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { NotificationChannel, OrderStatus, PaymentStatus } from "@prisma/client";
import { PrismaService } from "../../../shared/prisma.service";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService
  ) {}

  async confirmMockPayment(orderNumber: string) {
    if (process.env.NODE_ENV === "production") {
      throw new NotFoundException("Not available in production");
    }
    return this.capture(orderNumber);
  }

  async capture(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { number: orderNumber },
      include: { payment: true, lines: true },
    });
    if (!order || !order.payment) throw new NotFoundException("Order not found");

    if (
      order.payment.status === PaymentStatus.CAPTURED &&
      order.status === OrderStatus.CONFIRMED
    ) {
      return this.summary(orderNumber, PaymentStatus.CAPTURED, order.status);
    }

    for (const line of order.lines) {
      if (line.variantId) {
        await this.inventory.commit(
          line.variantId,
          line.qty,
          `order:${orderNumber}`
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { orderId: order.id },
        data: { status: PaymentStatus.CAPTURED },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CONFIRMED },
      }),
    ]);

    if (order.userId) {
      await this.prisma.notification
        .create({
          data: {
            userId: order.userId,
            channel: NotificationChannel.EMAIL,
            type: "ORDER_CONFIRMED",
            payload: { orderNumber } as never,
          },
        })
        .catch(() => undefined);
    }

    this.logger.log(`Order ${orderNumber} confirmed and paid`);
    return this.summary(orderNumber, PaymentStatus.CAPTURED, OrderStatus.CONFIRMED);
  }

  async handleRazorpayWebhook(rawBody: string, signature: string | undefined) {
    if (!signature) return { received: false };
    const { createHmac } = await import("node:crypto");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
    if (!secret) return { received: false };
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    if (expected !== signature) return { received: false };

    const event = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: { entity?: { notes?: { orderNumber?: string } } };
      };
    };

    if (
      event.event === "payment.captured" ||
      event.event === "order.paid"
    ) {
      const orderNumber =
        event.payload?.payment?.entity?.notes?.orderNumber;
      if (orderNumber) {
        await this.capture(orderNumber).catch((e) =>
          this.logger.warn(`Webhook capture failed: ${e.message}`)
        );
      }
    }
    return { received: true };
  }

  private summary(orderNumber: string, paymentStatus: PaymentStatus, orderStatus: OrderStatus) {
    return { orderNumber, paymentStatus, orderStatus };
  }
}
