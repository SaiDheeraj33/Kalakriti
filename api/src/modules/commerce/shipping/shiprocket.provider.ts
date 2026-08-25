import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { ShipmentQuote, ShippingProvider } from "./shipping-provider.interface";

@Injectable()
export class ShiprocketProvider implements ShippingProvider {
  readonly name = "shiprocket";

  async quote(_subtotalMinor: number, _pincode: string): Promise<ShipmentQuote> {
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
      throw new ServiceUnavailableException(
        "Shiprocket credentials not configured"
      );
    }
    throw new ServiceUnavailableException(
      "Live Shiprocket rates arrive with fulfilment rollout (Phase 6)"
    );
  }
}
