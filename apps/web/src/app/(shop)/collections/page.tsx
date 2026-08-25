import type { Metadata } from "next";
import Link from "next/link";
import { fetchApi, type CollectionInfo } from "@/lib/api";

export const metadata: Metadata = {
  title: "Collections",
};

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await fetchApi<CollectionInfo[]>("/collections");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.35em] text-gold">Browse</p>
      <h1 className="mt-3 font-display text-4xl font-medium sm:text-5xl">
        All collections
      </h1>

      {!collections || collections.length === 0 ? (
        <p className="mt-10 text-ink/60">
          The catalogue is being curated. Please check back shortly.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {collections.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="group rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <p className="font-display text-2xl">{c.title}</p>
              <p className="mt-2 line-clamp-2 text-sm text-ink/55">
                {c.description}
              </p>
              <p className="mt-6 text-xs uppercase tracking-widest text-gold">
                {c._count.products} piece{c._count.products === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
