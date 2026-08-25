import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../../../shared/decorators/public.decorator";
import { extractCartToken } from "./cart-token.util";
import { CartService } from "./cart.service";
import { AddCartItemDto } from "./dto/add-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { OptionalAuthGuard } from "../checkout/optional-auth.guard";

@Controller("cart")
@Public()
@UseGuards(OptionalAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private token(req: Request): string {
    const token = extractCartToken(req.headers);
    if (!token || token.length < 8) {
      throw new BadRequestException("Valid X-Cart-Token header required");
    }
    return token;
  }

  @Get()
  get(@Req() req: Request) {
    return this.cartService.getHydrated(this.token(req));
  }

  @Post("items")
  add(@Req() req: Request, @Body() dto: AddCartItemDto) {
    const userId = (req as Request & { user?: { sub?: string } }).user?.sub ?? null;
    return this.cartService.addItem(this.token(req), userId, dto.variantId, dto.qty);
  }

  @Patch("items/:id")
  updateQty(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartService.updateQty(this.token(req), id, dto.qty);
  }

  @Delete("items/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: Request, @Param("id") id: string): Promise<void> {
    await this.cartService.removeItem(this.token(req), id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clear(@Req() req: Request): Promise<void> {
    await this.cartService.clear(this.token(req));
  }
}
