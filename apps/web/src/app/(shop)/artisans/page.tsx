import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { fetchApi } from "@/lib/api";

export const metadata: Metadata = {
  title: "Our Artisans",
};

export const dynamic = "force-dynamic";

interface ArtisanCard {
  slug: string;
  displayName: string;
  bio: string | null;
  crafts: string[];
  city: string | null;
  state: string | null;
  yearsOfExperience: number | null;
  _count: { products: number };
}

export default async function ArtisansPage() {
  const artisans = await fetchApi<ArtisanCard[]>("/artisans");

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs uppercase tracking-[0.35em] text-gold">The Hands Behind</p>
      <h1 className="mt-3 font-display text-4xl font-medium sm:text-5xl">
        Master artisans of Kalakriti
      </h1>
      <p className="mt-4 max-w-xl text-ink/60">
        Every weaver, caster and painter here is verified by our heritage panel
        and paid directly — no middlemen, ever.
      </p>

      {!artisans || artisans.length === 0 ? (
        <p className="mt-10 text-ink/60">Artisan profiles are being curated.</p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artisans.map((a) => (
            <article
              key={a.slug}
              className="flex flex-col rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">{a.displayName}</h2>
                <span className="rounded-full bg-emerald/10 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-emerald">
                  Verified
                </span>
              </div>
              {(a.city || a.state) && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
                  <MapPin size={13} />
                  {[a.city, a.state].filter(Boolean).join(", ")}
                </p>
              )}
              {a.bio && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink/60">{a.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {a.crafts.slice(0, 3).map((craft) => (
                  <span key={craft} className="rounded-full bg-sand px-3 py-1 text-xs text-ink/70">
                    {craft}
                  </span>
                ))}
              </div>
              <p className="mt-auto pt-5 text-xs uppercase tracking-widest text-gold">
                {a._count.products} piece{a._count.products === 1 ? "" : "s"} in store
                {a.yearsOfExperience ? ` · ${a.yearsOfExperience} yrs` : ""}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
