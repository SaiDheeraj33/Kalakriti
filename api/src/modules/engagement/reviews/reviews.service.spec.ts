import { Test } from "@nestjs/testing";
import { OrderStatus } from "@prisma/client";
import { ReviewsService } from "./reviews.service";
import { PrismaService } from "../../../shared/prisma.service";

describe("ReviewsService", () => {
  let service: ReviewsService;
  let prisma: {
    product: { findUnique: jest.Mock };
    orderLine: { findFirst: jest.Mock };
    review: {
      upsert: jest.Mock;
      findMany: jest.Mock;
      aggregate: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      product: { findUnique: jest.fn() },
      orderLine: { findFirst: jest.fn() },
      review: {
        upsert: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: null }, _count: 0 }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (ops) => ops),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ReviewsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ReviewsService);
  });

  it("flags verifiedPurchase when buyer has a confirmed order line", async () => {
    prisma.product.findUnique.mockResolvedValue({ status: "ACTIVE" });
    prisma.orderLine.findFirst.mockResolvedValue({ id: "line1" });
    prisma.review.upsert.mockImplementation(({ create }) => create);

    const created = await service.create("u1", {
      productId: "p1",
      rating: 5,
      title: "Exquisite",
    });

    expect(created.verifiedPurchase).toBe(true);
    expect(prisma.orderLine.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          productId: "p1",
          order: {
            userId: "u1",
            status: { in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] },
          },
        }),
      })
    );
  });

  it("keeps review unverified without purchase history", async () => {
    prisma.product.findUnique.mockResolvedValue({ status: "ACTIVE" });
    prisma.orderLine.findFirst.mockResolvedValue(null);
    prisma.review.upsert.mockImplementation(({ create }) => create);

    const created = await service.create("u2", { productId: "p1", rating: 4 });
    expect(created.verifiedPurchase).toBe(false);
  });

  it("rejects reviews for unknown products", async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(
      service.create("u1", { productId: "ghost", rating: 5 })
    ).rejects.toThrow(/not found/i);
  });
});
