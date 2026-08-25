"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { cartFetch } from "@/lib/cart-client";

interface OrderView {
  number: string;
  status: string;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  currency: string;
  createdAt: string;
  lines: {
    id: string;
    titleSnapshot: string;
    skuSnapshot: string | null;
    imageSnapshot: string | null;
    qty: number;
    priceMinor: number;
    totalMinor: number;
  }[];
  payment?: { provider: string; status: string; providerRef: string | null };
}

const STATUS_STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

function fmt(minor: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export default function OrderPage() {
  const params = useParams<{ number: string }>();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.number) return;
    cartFetch<OrderView>(`/orders/${params.number}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : "Order not found"));
  }, [params?.number]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="font-display text-3xl">Could not load order</p>
        <p className="mt-3 text-ink/55">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-ink/50">
        Loading order...
      </div>
    );
  }

  const stepIndex =
    order.status === "CONFIRMED"
      ? 1
      : order.status === "SHIPPED"
        ? 2
        : order.status === "DELIVERED"
          ? 3
          : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <CheckCircle2 size={56} className="mx-auto text-emerald" />
        <h1 className="mt-5 font-display text-4xl font-medium">
          Thank you — your order is confirmed
        </h1>
        <p className="mt-3 tracking-widest text-ink/50">{order.number}</p>
      </div>

      <ol className="mt-12 flex items-center justify-between">
        {STATUS_STEPS.map((step, i) => (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                i <= stepIndex
                  ? "border-emerald bg-emerald text-white"
                  : "border-ink/15 text-ink/30"
              }`}
            >
              {i === 0 && <Package size={18} />}
              {i === 1 && <CheckCircle2 size={18} />}
              {i >= 2 && <Truck size={18} />}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`mx-2 h-px flex-1 ${i < stepIndex ? "bg-emerald" : "bg-ink/15"}`} />
            )}
          </li>
        ))}
      </ol>

      <ul className="mt-12 divide-y divide-ink/10 border-y border-ink/10">
        {order.lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-4 py-4 text-sm">
            <div>
              <p className="font-medium">{line.titleSnapshot}</p>
              <p className="text-xs uppercase tracking-widest text-ink/40">
                {line.skuSnapshot} · Qty {line.qty}
              </p>
            </div>
            <p>{fmt(line.totalMinor)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between text-ink/60">
          <dt>Subtotal</dt><dd>{fmt(order.subtotalMinor)}</dd>
        </div>
        <div className="flex justify-between text-ink/60">
          <dt>Shipping</dt>
          <dd>{order.shippingMinor === 0 ? "Free" : fmt(order.shippingMinor)}</dd>
        </div>
        <div className="flex justify-between border-t border-ink/10 pt-3 font-medium">
          <dt>Total paid</dt>
          <dd>{fmt(order.totalMinor)}</dd>
        </div>
      </dl>

      <div className="mt-10 text-center">
        <Link href="/collections" className="text-sm text-terracotta hover:underline">
          Continue exploring the collections →
        </Link>
      </div>
    </div>
  );
}
