import { Injectable } from "@nestjs/common";
import type { ShipmentQuote, ShippingProvider } from "./shipping-provider.interface";

@Injectable()
export class FlatRateShippingProvider implements ShippingProvider {
  readonly name = "flat-rate";

  async quote(subtotalMinor: number, _pincode: string): Promise<ShipmentQuote> {
    const insured = subtotalMinor >= 10000000;
    return {
      provider: this.name,
      serviceLevel: insured ? "insured-white-glove" : "standard-ground",
      amountMinor: subtotalMinor >= 200000 ? 0 : 19900,
      etaDays: insured ? 7 : 4,
    };
  }
}
