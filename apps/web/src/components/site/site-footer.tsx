import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    heading: "Shop",
    links: [
      { label: "Antiques", href: "/collections/antiques" },
      { label: "Handmade Crafts", href: "/collections/crafts" },
      { label: "Looms & Textiles", href: "/collections/looms-textiles" },
      { label: "Traditional Sarees", href: "/collections/sarees" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Artisans", href: "/artisans" },
      { label: "Journal", href: "/journal" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Shipping & Returns", href: "/support/shipping" },
      { label: "Certificates of Authenticity", href: "/support/authenticity" },
      { label: "Care Guide", href: "/support/care" },
      { label: "Contact Us", href: "/support/contact" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 bg-sand/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <p className="font-display text-2xl tracking-[0.28em] font-semibold">
              KALAKRITI<span className="text-gold">.</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">
              Handcrafted heritage, delivered home. Every piece carries a
              story — of hands, looms and centuries of tradition.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
                {col.heading}
              </p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/70 transition-colors hover:text-terracotta"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 sm:flex-row">
          <p className="text-xs text-ink/50">
            © {year} Kalakriti. All rights reserved.
          </p>
          <p className="text-xs tracking-widest text-ink/40">
            UPI · VISA · MASTERCARD · RUPAY · NET BANKING
          </p>
        </div>
      </div>
    </footer>
  );
}
