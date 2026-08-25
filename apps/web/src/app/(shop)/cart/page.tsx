"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@kalakriti/ui";
import {
  cartFetch,
  formatINRClient,
  type CartState,
} from "@/lib/cart-client";

interface CheckoutResult {
  order: { number: string; totalMinor: number; status: string };
  payment: { provider: string; providerRef: string };
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setCart(await cartFetch<CartState>("/cart"));
    } catch {
      setError("Could not load your bag. Is the API running?");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateQty(itemId: string, qty: number) {
    if (!cart) return;
    setCart(await cartFetch<CartState>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ qty }),
    }));
  }

  async function removeItem(itemId: string) {
    await cartFetch(`/cart/items/${itemId}`, { method: "DELETE" });
    void load();
  }

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const result = await cartFetch<CheckoutResult>("/checkout", {
        method: "POST",
        body: JSON.stringify({
          address: {
            line1: "12 Heritage Lane",
            city: "New Delhi",
            state: "Delhi",
            pincode: "110001",
          },
        }),
      });

      if (result.payment.provider === "mock") {
        await cartFetch("/payments/mock-confirm", {
          method: "POST",
          body: JSON.stringify({ orderNumber: result.order.number }),
        });
      }
      router.push(`/order/${result.order.number}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  if (!cart) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-ink/50">
        {error || "Loading your bag..."}
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-display text-3xl">Your bag is empty</p>
        <p className="mt-3 text-ink/55">
          Discover heirlooms waiting to be yours.
        </p>
        <Link href="/collections" className="mt-8 inline-block">
          <Button>Explore Collections</Button>
        </Link>
      </div>
    );
  }

  const shippingMinor = cart.subtotalMinor >= 200000 ? 0 : 19900;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-medium">Your Bag</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-ink/10 border-y border-ink/10">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-5 py-6">
              <Link
                href={`/product/${item.slug}`}
                className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-sand font-display text-2xl text-ink/40"
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  item.title.charAt(0)
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <Link href={`/product/${item.slug}`} className="font-display text-lg hover:text-terracotta">
                  {item.title}
                </Link>
                <p className="text-xs uppercase tracking-widest text-ink/40">{item.sku}</p>
                {item.available === 0 && (
                  <p className="mt-1 text-xs text-terracotta">Out of stock</p>
                )}

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-ink/15">
                    <button type="button" aria-label="Decrease" onClick={() => updateQty(item.id, item.qty - 1)} className="px-3 py-2 hover:text-terracotta">
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm">{item.qty}</span>
                    <button type="button" aria-label="Increase" onClick={() => updateQty(item.id, item.qty + 1)} className="px-3 py-2 hover:text-terracotta">
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-medium">{formatINRClient(item.lineTotalMinor)}</p>
                </div>
              </div>

              <button type="button" aria-label="Remove" onClick={() => removeItem(item.id)} className="self-start p-1 text-ink/30 hover:text-terracotta">
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-xl">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/55">Subtotal</dt>
              <dd>{formatINRClient(cart.subtotalMinor)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/55">Shipping</dt>
              <dd>{shippingMinor === 0 ? "Free" : formatINRClient(shippingMinor)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-medium">
              <dt>Total</dt>
              <dd>{formatINRClient(cart.subtotalMinor + shippingMinor)}</dd>
            </div>
          </dl>

          {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

          <Button className="mt-6 w-full" size="lg" onClick={checkout} disabled={busy}>
            {busy ? "Placing order..." : "Proceed to Checkout"}
          </Button>
          <p className="mt-3 text-center text-xs text-ink/40">
            Insured shipping · Easy returns · Authenticity assured
          </p>
        </aside>
      </div>
    </div>
  );
}
