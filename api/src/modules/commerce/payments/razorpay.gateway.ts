import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PaymentProvider } from "@prisma/client";
import { createHmac } from "node:crypto";
import type {
  GatewayPaymentIntent,
  PaymentGateway,
} from "./payment-gateway.interface";

interface RazorpayOrderResponse {
  id: string;
}

@Injectable()
export class RazorpayGateway implements PaymentGateway {
  readonly provider = PaymentProvider.RAZORPAY;

  private get configured(): boolean {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  private authHeader(): string {
    const token = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString("base64");
    return `Basic ${token}`;
  }

  async createPaymentIntent(input: {
    orderNumber: string;
    amountMinor: number;
    currency: string;
    customerEmail?: string;
  }): Promise<GatewayPaymentIntent> {
    if (!this.configured) {
      throw new ServiceUnavailableException("Razorpay keys not configured");
    }

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: this.authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountMinor,
        currency: input.currency,
        receipt: input.orderNumber,
        notes: { orderNumber: input.orderNumber },
      }),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(`Razorpay order failed (${res.status})`);
    }
    const data = (await res.json()) as RazorpayOrderResponse;

    return {
      provider: this.provider,
      providerRef: data.id,
      amountMinor: input.amountMinor,
      currency: input.currency,
    };
  }

  verifyPaymentSignature(input: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    signature: string;
  }): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
    const expected = createHmac("sha256", secret)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest("hex");
    return expected === input.signature;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
    if (!secret) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    return expected === signature;
  }
}
