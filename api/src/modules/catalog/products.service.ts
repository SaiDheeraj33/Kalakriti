import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ProductStatus } from "@prisma/client";
import { MeiliService, type ProductIndexDoc } from "../../shared/meili.service";
import { PrismaService } from "../../shared/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

const LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  type: true,
  status: true,
  basePriceMinor: true,
  currency: true,
  collections: { select: { slug: true } },
  images: { orderBy: { position: "asc" as const }, take: 1, select: { url: true } },
} satisfies Prisma.ProductSelect;

export interface ListProductsQuery {
  q?: string;
  type?: string;
  collection?: string;
  page?: string;
  limit?: string;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meili: MeiliService
  ) {}

  async list(query: ListProductsQuery) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(48, Math.max(1, Number(query.limit ?? 12) || 12));

    const where: Prisma.ProductWhereInput = { status: ProductStatus.ACTIVE };
    if (query.type) where.type = query.type as never;
    if (query.collection) {
      where.collections = { some: { slug: query.collection } };
    }
    if (query.q) {
      const term = query.q.trim();
      where.OR = [
        { title: { contains: term, mode: "insensitive" } },
        { subtitle: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((p) => ({ ...p, primaryImageUrl: p.images[0]?.url ?? null, images: undefined })),
      total,
      page,
      limit,
    };
  }

  async bySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        variants: {
          where: { isActive: true },
          select: { id: true, sku: true, priceMinor: true, attributes: true },
        },
        artisanProfile: {
          select: {
            displayName: true,
            slug: true,
            city: true,
            state: true,
            crafts: true,
          },
        },
        collections: { select: { slug: true, title: true } },
        certificates: {
          select: { certificateNo: true, issuedAt: true, details: true },
        },
      },
    });
    if (!product || product.status === ProductStatus.ARCHIVED) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = await this.uniqueSlug(dto.slug ?? this.slugify(dto.title));

    const data: Prisma.ProductCreateInput = {
      title: dto.title,
      slug,
      subtitle: dto.subtitle,
      description: dto.description,
      type: dto.type,
      status: dto.status ?? ProductStatus.DRAFT,
      basePriceMinor: dto.basePriceMinor,
      currency: dto.currency ?? "INR",
      attributes: (dto.attributes ?? Prisma.DbNull) as Prisma.InputJsonValue,
    };
    if (dto.collectionSlugs?.length) {
      data.collections = { connect: dto.collectionSlugs.map((s) => ({ slug: s })) };
    }
    if (dto.images?.length) {
      data.images = {
        create: dto.images.map((img, i) => ({
          url: img.url,
          alt: img.alt,
          position: img.position ?? i,
        })),
      };
    }

    const created = await this.prisma.product.create({
      data,
      include: { collections: true, images: true },
    });
    await this.syncOne(created.id);
    return created;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);

    const data: Prisma.ProductUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.subtitle !== undefined) data.subtitle = dto.subtitle;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.basePriceMinor !== undefined) data.basePriceMinor = dto.basePriceMinor;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.attributes !== undefined) {
      data.attributes = dto.attributes as Prisma.InputJsonValue;
    }
    if (dto.collectionSlugs) {
      data.collections = { set: dto.collectionSlugs.map((s) => ({ slug: s })) };
    }
    if (dto.images) {
      data.images = {
        deleteMany: {},
        create: dto.images.map((img, i) => ({
          url: img.url,
          alt: img.alt,
          position: img.position ?? i,
        })),
      };
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data,
      include: { collections: true, images: true },
    });

    if (updated.status === ProductStatus.ARCHIVED) {
      await this.meili.deleteProducts([id]);
    } else {
      await this.syncOne(id);
    }
    return updated;
  }

  async archive(id: string) {
    await this.ensureExists(id);
    const archived = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });
    await this.meili.deleteProducts([id]);
    return archived;
  }

  private async syncOne(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { ...LIST_SELECT, description: true },
    });
    if (!product) return;
    const doc: ProductIndexDoc = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description ?? null,
      type: product.type,
      status: product.status,
      basePriceMinor: product.basePriceMinor,
      currency: product.currency,
      collections: product.collections.map((c) => c.slug),
      image: product.images[0]?.url ?? null,
    };
    await this.meili.upsertProducts([doc]);
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
  }

  private async uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let n = 2;
    while (
      await this.prisma.product.findUnique({ where: { slug: candidate } })
    ) {
      candidate = `${base}-${n++}`;
      if (n > 50) throw new BadRequestException("Could not derive unique slug");
    }
    return candidate;
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.product.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("Product not found");
  }
}
