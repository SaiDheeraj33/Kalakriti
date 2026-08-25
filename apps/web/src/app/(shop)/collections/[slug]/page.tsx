import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/product-card";
import { fetchApi, type CollectionInfo, type ProductListResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function getCollection(slug: string): Promise<CollectionInfo | null> {
  return fetchApi<CollectionInfo>(`/collections/${slug}`);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  return { title: collection?.title ?? "Collection" };
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();

  const data = await fetchApi<ProductListResponse>(
    `/products?collection=${slug}&limit=24`
  );

  return (
    <div>
      <section className="border-b border-ink/10 bg-sand/50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Collection</p>
          <h1 className="mt-3 font-display text-4xl font-medium sm:text-5xl">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-4 max-w-xl text-ink/60">{collection.description}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {!data || data.items.length === 0 ? (
          <p className="text-ink/60">
            No pieces in this collection yet - new arrivals are being catalogued.
          </p>
        ) : (
          <>
            <p className="mb-8 text-sm text-ink/45">
              {data.total} piece{data.total === 1 ? "" : "s"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
