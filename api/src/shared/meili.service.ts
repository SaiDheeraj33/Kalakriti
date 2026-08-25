import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { MeiliSearch } from "meilisearch";

export interface ProductIndexDoc {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  type: string;
  status: string;
  basePriceMinor: number;
  currency: string;
  collections: string[];
  image: string | null;
}

@Injectable()
export class MeiliService implements OnModuleInit {
  private readonly logger = new Logger(MeiliService.name);
  private client: MeiliSearch | null = null;

  onModuleInit(): void {
    const host = process.env.MEILI_HOST;
    if (!host) {
      this.logger.warn("MEILI_HOST not set - search sync disabled (graceful)");
      return;
    }
    this.client = new MeiliSearch({
      host,
      apiKey: process.env.MEILI_MASTER_KEY ?? "",
    });
    this.logger.log(`Meilisearch connected at ${host}`);
  }

  async upsertProducts(docs: ProductIndexDoc[]): Promise<void> {
    if (!this.client || docs.length === 0) return;
    try {
      const index = await this.ensureProductsIndex();
      await index.updateDocuments(docs, { primaryKey: "id" });
    } catch (err) {
      this.logger.warn(`Search sync skipped: ${(err as Error).message}`);
    }
  }

  async deleteProducts(ids: string[]): Promise<void> {
    if (!this.client || ids.length === 0) return;
    try {
      const index = await this.ensureProductsIndex();
      await index.deleteDocuments(ids);
    } catch (err) {
      this.logger.warn(`Search delete skipped: ${(err as Error).message}`);
    }
  }

  private async ensureProductsIndex() {
    const index = this.client!.index("products");
    await Promise.all([
      index.updateFilterableAttributes(["type", "status", "collections"]),
      index.updateSortableAttributes(["basePriceMinor"]),
    ]);
    return index;
  }
}
