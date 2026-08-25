export function ArtisanBand() {
  return (
    <section className="bg-emerald text-ivory">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Our Promise</p>
          <h2 className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">
            Every piece is authenticated.
            <br />
            Every artisan is paid fairly.
          </h2>
          <p className="mt-6 max-w-xl leading-relaxed text-ivory/75">
            Antiques ship with a Certificate of Authenticity and documented
            provenance. Textiles and crafts are bought directly from artisan
            clusters — no middlemen, ever.
          </p>
        </div>
        <div className="space-y-8 border-l border-ivory/15 pl-10">
          <div>
            <p className="font-display text-5xl text-gold">120+</p>
            <p className="mt-1 text-sm uppercase tracking-widest text-ivory/60">
              Master artisans
            </p>
          </div>
          <div>
            <p className="font-display text-5xl text-gold">40</p>
            <p className="mt-1 text-sm uppercase tracking-widest text-ivory/60">
              Heritage crafts
            </p>
          </div>
          <div>
            <p className="font-display text-5xl text-gold">100%</p>
            <p className="mt-1 text-sm uppercase tracking-widest text-ivory/60">
              Certified authenticity
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
