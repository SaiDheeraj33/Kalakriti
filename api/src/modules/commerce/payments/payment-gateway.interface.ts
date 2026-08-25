import { PaymentProvider } from "@prisma/client";

export interface GatewayPaymentIntent {
  provider: PaymentProvider;
  providerRef: string;
  amountMinor: number;
  currency: string;
}

export interface PaymentGateway {
  readonly provider: PaymentProvider;
  createPaymentIntent(input: {
    orderNumber: string;
    amountMinor: number;
    currency: string;
    customerEmail?: string;
  }): Promise<GatewayPaymentIntent>;
}
