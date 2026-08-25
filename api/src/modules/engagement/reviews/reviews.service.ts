import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus, ReviewStatus } from "@prisma/client";
import { PrismaService } from "../../../shared/prisma.service";
import { CreateReviewDto } from "./dto/create-review.dto";

const PURCHASED_STATUSES = [
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { status: true },
    });
    if (!product || product.status !== "ACTIVE") {
      throw new NotFoundException("Product not found");
    }

    const purchased = await this.prisma.orderLine.findFirst({
      where: {
        productId: dto.productId,
        order: { userId, status: { in: PURCHASED_STATUSES } },
      },
    });

    return this.prisma.review.upsert({
      where: { userId_productId: { userId, productId: dto.productId } },
      update: {
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        status: ReviewStatus.PENDING,
        verifiedPurchase: Boolean(purchased),
      },
      create: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        body: dto.body,
        verifiedPurchase: Boolean(purchased),
      },
    });
  }

  async listByProduct(productId: string) {
    const [items, agg] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { productId, status: ReviewStatus.APPROVED },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          verifiedPurchase: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      this.prisma.review.aggregate({
        where: { productId, status: ReviewStatus.APPROVED },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      summary: {
        average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
        count: agg._count,
      },
      items: items.map((r) => ({ ...r, author: r.user.name, user: undefined })),
    };
  }

  async moderate(reviewId: string, status: ReviewStatus) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException("Review not found");
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });
  }
}
