import { Module } from "@nestjs/common";
import { MeiliService } from "../../shared/meili.service";
import { CollectionsController } from "./collections.controller";
import { CollectionsService } from "./collections.service";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  controllers: [ProductsController, CollectionsController],
  providers: [ProductsService, CollectionsService, MeiliService],
})
export class CatalogModule {}
