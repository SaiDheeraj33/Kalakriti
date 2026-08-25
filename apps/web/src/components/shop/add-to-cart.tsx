"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@kalakriti/ui";
import { cartFetch, type CartState } from "@/lib/cart-client";

export function AddToCart({ variantId }: { variantId: string }) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function addToCart() {
    setState("busy");
    setMessage("");
    try {
      await cartFetch<CartState>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId, qty }),
      });
      setState("done");
      router.refresh();
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Could not add to bag");
    }
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <div className="flex items-center rounded-full border border-ink/20">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-4 py-3 text-lg leading-none hover:text-terracotta"
        >
          −
        </button>
        <span className="w-8 text-center text-sm">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => Math.min(5, q + 1))}
          className="px-4 py-3 text-lg leading-none hover:text-terracotta"
        >
          +
        </button>
      </div>

      <Button size="lg" onClick={addToCart} disabled={state === "busy"}>
        {state === "done" ? (
          <>
            <Check size={18} /> Added to Bag
          </>
        ) : (
          <>
            <ShoppingBag size={18} />
            {state === "busy" ? "Adding..." : "Add to Bag"}
          </>
        )}
      </Button>

      {state === "error" && (
        <p className="text-sm text-terracotta">{message}</p>
      )}
    </div>
  );
}
