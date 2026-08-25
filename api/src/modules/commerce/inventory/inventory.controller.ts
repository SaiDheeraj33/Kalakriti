import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../../../shared/decorators/public.decorator";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get("availability")
  availability(@Query("variantIds") variantIds: string) {
    const ids = (variantIds ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    return this.inventoryService.availability(ids);
  }
}
