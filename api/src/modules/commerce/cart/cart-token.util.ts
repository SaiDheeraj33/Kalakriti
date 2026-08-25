export const CART_TOKEN_HEADER = "x-cart-token";

export function extractCartToken(headers: {
  [key: string]: string | string[] | undefined;
}): string | null {
  const raw = headers[CART_TOKEN_HEADER];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}
