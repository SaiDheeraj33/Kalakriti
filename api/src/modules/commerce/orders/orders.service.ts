import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../shared/prisma.service";

const ORDER_INCLUDE = {
  lines: true,
  payment: {
    select: { provider: true, status: true, providerRef: true },
  },
  shipment: {
    select: { provider: true, trackingNumber: true, status: true },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findForRequester(params: {
    number: string;
    userId?: string;
    role?: string;
    cartToken?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { number: params.number },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException("Order not found");

    const isAdmin = params.role === "ADMIN";
    const isOwner = Boolean(params.userId && order.userId === params.userId);
    const isGuestWithToken =
      order.userId === null && Boolean(params.cartToken) && order.cartToken === params.cartToken;

    if (!isAdmin && !isOwner && !isGuestWithToken) {
      throw new ForbiddenException("You do not have access to this order");
    }
    return order;
  }

  listMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId, status: { not: OrderStatus.PENDING } },
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
      take: 50,
    });
  }
}
