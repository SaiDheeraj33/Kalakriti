import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { CurrentUser } from "../../../shared/decorators/current-user.decorator";
import { WishlistService } from "./wishlist.service";

@Controller("wishlist/me")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  list(@CurrentUser("sub") userId: string) {
    return this.wishlistService.listMine(userId);
  }

  @Post(":productSlug")
  @HttpCode(HttpStatus.OK)
  add(@CurrentUser("sub") userId: string, @Param("productSlug") slug: string) {
    return this.wishlistService.add(userId, slug);
  }

  @Delete(":productSlug")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser("sub") userId: string,
    @Param("productSlug") slug: string
  ): Promise<void> {
    await this.wishlistService.remove(userId, slug);
  }
}
