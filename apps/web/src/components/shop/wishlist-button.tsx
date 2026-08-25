"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getAccessToken } from "@/lib/cart-client";

export function WishlistButton({ productSlug }: { productSlug: string }) {
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/wishlist/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((items: { product: { slug: string } }[]) =>
        setSaved(items.some((i) => i.product.slug === productSlug))
      )
      .catch(() => undefined);
  }, [productSlug]);

  async function toggle() {
    const token = getAccessToken();
    if (!token) {
      setNote("Sign in to save favourites");
      return;
    }
    const res = saved
      ? await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/wishlist/me/${productSlug}`,
          { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
        )
      : await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/wishlist/me/${productSlug}`,
          { method: "POST", headers: { Authorization: `Bearer ${token}` } }
        );
    if (res.ok || res.status === 204) setSaved(!saved);
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-2 text-sm transition-colors ${
          saved ? "text-terracotta" : "text-ink/50 hover:text-terracotta"
        }`}
        aria-pressed={saved}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
      {note && <span className="text-xs text-gold">{note}</span>}
    </div>
  );
}
