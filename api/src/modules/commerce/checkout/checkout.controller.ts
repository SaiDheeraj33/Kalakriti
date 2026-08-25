import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../../../shared/decorators/public.decorator";
import { extractCartToken } from "../cart/cart-token.util";
import { OptionalAuthGuard } from "./optional-auth.guard";
import { CheckoutService } from "./checkout.service";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Controller("checkout")
@Public()
@UseGuards(OptionalAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  start(@Req() req: Request, @Body() dto: CreateCheckoutDto) {
    const cartToken = extractCartToken(req.headers);
    if (!cartToken || cartToken.length < 8) {
      throw new BadRequestException("Valid X-Cart-Token header required");
    }
    return this.checkoutService.startCheckout({
      cartToken,
      dto,
      user: (req as Request & { user?: { sub: string; email: string } }).user,
    });
  }
}
