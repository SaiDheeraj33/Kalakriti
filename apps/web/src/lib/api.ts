export interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  type: "ANTIQUE" | "TEXTILE" | "CRAFT";
  status: string;
  basePriceMinor: number;
  currency: string;
  primaryImageUrl: string | null;
  collections?: { slug: string }[];
}

export interface ProductListResponse {
  items: ProductSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface CertificateInfo {
  certificateNo: string;
  issuedAt: string;
  details: Record<string, unknown> | null;
}

export interface ProductDetail {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  type: ProductSummary["type"];
  status: string;
  basePriceMinor: number;
  currency: string;
  attributes: Record<string, unknown> | null;
  images: { id: string; url: string; alt: string | null; position: number }[];
  variants: { id: string; sku: string; priceMinor: number | null; attributes: unknown }[];
  artisanProfile: {
    displayName: string;
    slug: string;
    city: string | null;
    state: string | null;
    crafts: string[];
  } | null;
  collections: { slug: string; title: string }[];
  certificates: CertificateInfo[];
}

export interface CollectionInfo {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  heroImageUrl: string | null;
  _count: { products: number };
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function fetchApi<T>(path: string, revalidate = 30): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function formatINR(minor: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
