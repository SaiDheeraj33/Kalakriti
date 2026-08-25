import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { CurrentUser } from "../../../shared/decorators/current-user.decorator";
import { Public } from "../../../shared/decorators/public.decorator";
import { extractCartToken } from "../cart/cart-token.util";
import { OptionalAuthGuard } from "../checkout/optional-auth.guard";
import { OrdersService } from "./orders.service";

@Controller("orders")
@Public()
@UseGuards(OptionalAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("me")
  mine(@CurrentUser("sub") userId: string) {
    if (!userId) return [];
    return this.ordersService.listMine(userId);
  }

  @Get(":number")
  byNumber(
    @Req() req: Request,
    @Param("number") number: string
  ) {
    const user = (req as Request & { user?: { sub: string; role: string } }).user;
    return this.ordersService.findForRequester({
      number,
      userId: user?.sub,
      role: user?.role,
      cartToken: extractCartToken(req.headers) ?? undefined,
    });
  }
}
