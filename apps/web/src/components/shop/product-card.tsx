import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductSummary } from "@/lib/api";
import { formatINR } from "@/lib/api";

const TYPE_STYLES: Record<ProductSummary["type"], string> = {
  ANTIQUE: "from-[#d9c9a8] via-[#c9b184] to-[#a8874f] text-ink",
  TEXTILE: "from-terracotta/90 via-terracotta-dark to-[#7c2f14] text-ivory",
  CRAFT: "from-emerald/85 via-emerald to-[#123529] text-ivory",
};

const TYPE_LABELS: Record<ProductSummary["type"], string> = {
  ANTIQUE: "Antique",
  TEXTILE: "Textile",
  CRAFT: "Craft",
};

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className={`relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${
          TYPE_STYLES[product.type]
        }`}
      >
        {product.primaryImageUrl ? (
          <img
            src={product.primaryImageUrl}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-display text-5xl opacity-40">
            {product.title.charAt(0)}
          </span>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-ink backdrop-blur">
          {TYPE_LABELS[product.type]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl leading-snug">{product.title}</h3>
          <ArrowUpRight
            size={18}
            className="mt-1 shrink-0 text-ink/30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-terracotta"
          />
        </div>
        {product.subtitle && (
          <p className="mt-1 line-clamp-2 text-sm text-ink/55">{product.subtitle}</p>
        )}
        <p className="mt-auto pt-4 text-base font-medium tracking-wide text-terracotta">
          {formatINR(product.basePriceMinor)}
        </p>
      </div>
    </Link>
  );
}
