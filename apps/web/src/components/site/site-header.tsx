"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Antiques", href: "/collections/antiques" },
  { label: "Crafts", href: "/collections/crafts" },
  { label: "Looms & Textiles", href: "/collections/looms-textiles" },
  { label: "Sarees", href: "/collections/sarees" },
  { label: "Artisans", href: "/artisans" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-ivory/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="p-2 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="font-display text-xl sm:text-2xl tracking-[0.28em] font-semibold">
          KALAKRITI<span className="text-gold">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-wide text-ink/70 transition-colors hover:text-terracotta"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" aria-label="Search" className="p-2 hover:text-terracotta transition-colors">
            <Search size={20} strokeWidth={1.5} />
          </button>
          <button type="button" aria-label="Wishlist" className="p-2 hover:text-terracotta transition-colors">
            <Heart size={20} strokeWidth={1.5} />
          </button>
          <button type="button" aria-label="Cart" className="relative p-2 hover:text-terracotta transition-colors">
            <ShoppingBag size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink/10 bg-ivory md:hidden">
          <div className="flex flex-col px-6 py-4 gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm tracking-wide text-ink/80"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
