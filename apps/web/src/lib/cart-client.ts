"use client";

import { API_BASE } from "./api";

const CART_KEY = "klk_cart_token";
const AUTH_KEY = "klk_access_token";

export function getCartToken(): string {
  if (typeof window === "undefined") return "";
  let token = window.localStorage.getItem(CART_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(CART_KEY, token);
  }
  return token;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_KEY);
}

export async function cartFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getCartToken();
  const accessToken = getAccessToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      "X-Cart-Token": token,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data?.message ?? `Request failed (${res.status})`), {
      status: res.status,
    });
  }
  return data as T;
}

export interface CartState {
  items: {
    id: string;
    variantId: string;
    slug: string;
    title: string;
    subtitle: string | null;
    imageUrl: string | null;
    sku: string;
    unitPriceMinor: number;
    currency: string;
    qty: number;
    lineTotalMinor: number;
    available: number;
  }[];
  itemCount: number;
  subtotalMinor: number;
  currency: string;
}

export function formatINRClient(minor: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}
