import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, ReviewStatus } from "@prisma/client";
import { PrismaService } from "../../shared/prisma.service";

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: [],
  CONFIRMED: ["PROCESSING", "SHIPPED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: [],
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

    const [ordersToday, revenueAgg, lowStock, draftProducts, pendingReviews, recentOrders] =
      await this.prisma.$transaction([
        this.prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.order.aggregate({
          where: { createdAt: { gte: startOfMonth }, payment: { status: "CAPTURED" } },
          _sum: { totalMinor: true },
        }),
        this.prisma.inventoryItem.findMany({
          where: { stock: { lte: this.prisma.inventoryItem.fields.lowStockThreshold } },
          take: 10,
          select: {
            stock: true,
            variant: {
              select: { sku: true, product: { select: { title: true, slug: true } } },
            },
          },
        }),
        this.prisma.product.count({ where: { status: "DRAFT" } }),
        this.prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
        this.prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            number: true,
            status: true,
            totalMinor: true,
            createdAt: true,
            user: { select: { email: true } },
          },
        }),
      ]);

    return {
      ordersToday,
      revenueMonthMinor: revenueAgg._sum.totalMinor ?? 0,
      lowStockCount: lowStock.length,
      lowStock,
      draftProducts,
      pendingReviews,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        customer: o.user?.email ?? "guest",
      })),
    };
  }

  listOrders(status?: OrderStatus, page = 1) {
    const limit = 20;
    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { email: true } },
          payment: { select: { status: true, provider: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.order.count({ where: status ? { status } : undefined }),
    ]).then(([items, total]) => ({ items, total, page }));
  }

  async transitionOrder(number: string, next: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { number },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot move order from ${order.status} to ${next}. Allowed: ${allowed.join(", ") || "none"}`
      );
    }

    const data: Parameters<typeof this.prisma.order.update>[0]["data"] = { status: next };
    if (next === OrderStatus.SHIPPED && !order.shipment) {
      await this.prisma.shipment.create({
        data: { orderId: order.id, provider: "flat-rate", status: "IN_TRANSIT" },
      });
    }
    return this.prisma.order.update({ where: { number }, data, include: { shipment: true } });
  }
}
