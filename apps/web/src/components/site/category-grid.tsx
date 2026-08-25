import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const CATEGORIES = [
  {
    index: "01",
    title: "Antiques",
    description: "Certified heirlooms, coins, bronzes & curiosities with provenance.",
    href: "/collections/antiques",
    gradient: "from-sand via-[#e6dcc8] to-[#d9c9a8]",
  },
  {
    index: "02",
    title: "Handmade Crafts",
    description: "Blue pottery, dhokra brass, woodwork & hand-painted artistry.",
    href: "/collections/crafts",
    gradient: "from-terracotta/90 via-terracotta-dark to-[#7c2f14]",
  },
  {
    index: "03",
    title: "Looms & Textiles",
    description: "Handloom throws, cushions & yardage straight off the loom.",
    href: "/collections/looms-textiles",
    gradient: "from-emerald via-emerald/85 to-[#123529]",
  },
  {
    index: "04",
    title: "Traditional Sarees",
    description: "Kanjivaram, Banarasi, Chanderi — exclusive heritage weaves.",
    href: "/collections/sarees",
    gradient: "from-gold/90 via-[#a37c2f] to-[#7c5d1d]",
  },
];

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Collections</p>
          <h2 className="mt-3 font-display text-4xl font-medium sm:text-5xl">
            Curated by craft
          </h2>
        </div>
        <Link
          href="/collections"
          className="hidden text-sm text-ink/60 underline-offset-4 transition-colors hover:text-terracotta hover:underline sm:block"
        >
          View all
        </Link>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className={`group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${cat.gradient} p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
          >
            <span className="font-display text-lg text-white/70">{cat.index}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-2xl text-white drop-shadow-sm">
                  {cat.title}
                </h3>
                <ArrowUpRight
                  size={20}
                  className="text-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {cat.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
