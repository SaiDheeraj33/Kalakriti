import { Controller, Get, Param } from "@nestjs/common";
import { Public } from "../../shared/decorators/public.decorator";
import { CollectionsService } from "./collections.service";

@Controller("collections")
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Public()
  @Get()
  list() {
    return this.collectionsService.list();
  }

  @Public()
  @Get(":slug")
  bySlug(@Param("slug") slug: string) {
    return this.collectionsService.bySlug(slug);
  }
}
