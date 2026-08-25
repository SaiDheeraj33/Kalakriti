export interface ShipmentQuote {
  provider: string;
  serviceLevel: string;
  amountMinor: number;
  etaDays: number;
}

export interface ShippingProvider {
  readonly name: string;
  quote(subtotalMinor: number, pincode: string): Promise<ShipmentQuote>;
}
