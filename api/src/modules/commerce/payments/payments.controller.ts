import { Body, Controller, Headers, HttpCode, HttpStatus, Param, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../../../shared/decorators/public.decorator";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post("mock-confirm")
  @HttpCode(HttpStatus.OK)
  mockConfirm(@Body("orderNumber") orderNumber: string) {
    return this.paymentsService.confirmMockPayment(orderNumber);
  }

  @Public()
  @Post("webhook/:provider")
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Param("provider") provider: string,
    @Headers("x-razorpay-signature") signature: string | undefined,
    @Req() req: Request & { rawBody?: Buffer }
  ) {
    if (provider !== "razorpay") return { received: false };
    const raw = req.rawBody?.toString("utf8") ?? "";
    return this.paymentsService.handleRazorpayWebhook(raw, signature);
  }
}
