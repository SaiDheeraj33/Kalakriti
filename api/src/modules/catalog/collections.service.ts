import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma.service";

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.collection.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        heroImageUrl: true,
        _count: {
          select: { products: { where: { status: "ACTIVE" } } },
        },
      },
    });
  }

  async bySlug(slug: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        heroImageUrl: true,
      },
    });
    if (!collection) throw new NotFoundException("Collection not found");
    return collection;
  }
}
