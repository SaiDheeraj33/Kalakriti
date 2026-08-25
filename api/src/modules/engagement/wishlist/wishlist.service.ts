import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        product: {
          select: {
            slug: true,
            title: true,
            subtitle: true,
            basePriceMinor: true,
            currency: true,
          },
        },
      },
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug: productId },
    });
    if (!product || product.status !== "ACTIVE") {
      throw new NotFoundException("Product not found");
    }
    await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId, productId: product.id } },
      update: {},
      create: { userId, productId: product.id },
    });
    return { wishlisted: true };
  }

  async remove(userId: string, productSlug: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { slug: productSlug },
    });
    if (!product) throw new NotFoundException("Product not found");
    await this.prisma.wishlistItem.deleteMany({
      where: { userId, productId: product.id },
    });
  }
}
