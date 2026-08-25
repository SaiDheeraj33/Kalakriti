import { Injectable } from "@nestjs/common";
import { PaymentProvider } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type {
  GatewayPaymentIntent,
  PaymentGateway,
} from "./payment-gateway.interface";

@Injectable()
export class MockGateway implements PaymentGateway {
  readonly provider = PaymentProvider.RAZORPAY;

  async createPaymentIntent(input: {
    orderNumber: string;
    amountMinor: number;
    currency: string;
  }): Promise<GatewayPaymentIntent> {
    return {
      provider: this.provider,
      providerRef: `mock_${input.orderNumber}_${randomUUID().slice(0, 8)}`,
      amountMinor: input.amountMinor,
      currency: input.currency,
    };
  }
}
