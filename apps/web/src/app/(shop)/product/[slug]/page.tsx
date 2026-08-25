import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { Button } from "@kalakriti/ui";
import { fetchApi, formatINR, type ProductDetail } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getProduct(slug: string): Promise<ProductDetail | null> {
  return fetchApi<ProductDetail>(`/products/${slug}`);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product?.title ?? "Product",
    description: product?.subtitle ?? undefined,
  };
}

const TYPE_BACKDROP: Record<ProductDetail["type"], string> = {
  ANTIQUE: "from-[#e6dcc8] via-[#d9c9a8] to-[#b99a63]",
  TEXTILE: "from-terracotta/80 via-terracotta-dark to-[#7c2f14]",
  CRAFT: "from-emerald/80 via-emerald to-[#123529]",
};

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim();
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const attributes = Object.entries(product.attributes ?? {});
  const certificate = product.certificates[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-8 text-sm text-ink/50">
        <Link href="/collections" className="hover:text-terracotta">
          Collections
        </Link>
        {product.collections[0] && (
          <>
            {" / "}
            <Link
              href={`/collections/${product.collections[0].slug}`}
              className="hover:text-terracotta"
            >
              {product.collections[0].title}
            </Link>
          </>
        )}
        {" / "}
        <span className="text-ink/80">{product.title}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-2">
        <div
          className={`flex aspect-[4/5] items-center justify-center rounded-3xl bg-gradient-to-br ${
            TYPE_BACKDROP[product.type]
          } shadow-lg`}
        >
          {product.images[0] ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt ?? product.title}
              className="h-full w-full rounded-3xl object-cover"
            />
          ) : (
            <span className="font-display text-[9rem] leading-none text-white/50">
              {product.title.charAt(0)}
            </span>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl font-medium leading-tight sm:text-5xl">
            {product.title}
          </h1>
          {product.subtitle && (
            <p className="mt-3 font-display text-xl italic text-ink/60">
              {product.subtitle}
            </p>
          )}

          <p className="mt-6 text-3xl tracking-wide text-terracotta">
            {formatINR(product.basePriceMinor)}
          </p>

          {product.description && (
            <p className="mt-6 leading-relaxed text-ink/70">{product.description}</p>
          )}

          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg">Enquire to Purchase</Button>
            <Button variant="outline" size="lg">
              Request More Images
            </Button>
          </div>

          {attributes.length > 0 && (
            <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-3 border-t border-ink/10 pt-8 sm:grid-cols-2">
              {attributes.map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4 border-b border-ink/5 pb-2">
                  <dt className="text-xs uppercase tracking-widest text-ink/45">
                    {humanize(key)}
                  </dt>
                  <dd className="text-right text-sm text-ink/85">
                    {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {certificate && (
            <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/5 p-5">
              <p className="flex items-center gap-2 font-medium">
                <ShieldCheck size={18} className="text-gold" />
                Certificate of Authenticity
              </p>
              <p className="mt-2 text-sm text-ink/65">
                {certificate.certificateNo} · issued{" "}
                {new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {certificate.details &&
                Object.entries(certificate.details).map(([k, v]) => (
                  <p key={k} className="mt-1 text-sm text-ink/55">
                    <span className="capitalize">{humanize(k)}:</span> {String(v)}
                  </p>
                ))}
            </div>
          )}

          {product.artisanProfile && (
            <div className="mt-8 rounded-2xl border border-emerald/25 bg-emerald/5 p-5">
              <p className="flex items-center gap-2 font-medium">
                <Sparkles size={18} className="text-emerald" />
                Woven by {product.artisanProfile.displayName}
              </p>
              {(product.artisanProfile.city || product.artisanProfile.state) && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/55">
                  <MapPin size={14} />
                  {[product.artisanProfile.city, product.artisanProfile.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {product.artisanProfile.crafts.map((craft) => (
                  <span
                    key={craft}
                    className="rounded-full bg-emerald/10 px-3 py-1 text-xs text-emerald"
                  >
                    {craft}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
