"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@kalakriti/ui";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pb-28 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            Est. 2026 · New Delhi
          </p>
          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.05] sm:text-6xl lg:text-7xl">
            Where every thread
            <br />
            tells a{" "}
            <em className="text-terracotta not-italic underline decoration-gold decoration-1 underline-offset-8">
              story
            </em>
            .
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ink/65 sm:text-lg">
            Certified antiques, handwoven sarees, artisan crafts and
            traditional looms — sourced directly from master craftspeople
            across India.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/collections">
              <Button size="lg">Explore Collections</Button>
            </Link>
            <Link href="/artisans">
              <Button variant="outline" size="lg">
                Meet the Artisans
              </Button>
            </Link>
          </div>

          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-ink/10 pt-8">
            <div>
              <dt className="text-xs uppercase tracking-widest text-ink/45">Artisans</dt>
              <dd className="mt-1 font-display text-3xl">120+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-ink/45">Crafts</dt>
              <dd className="mt-1 font-display text-3xl">40</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-ink/45">Certified</dt>
              <dd className="mt-1 font-display text-3xl">100%</dd>
            </div>
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          className="relative hidden h-[520px] lg:block"
          aria-hidden
        >
          <div className="absolute right-6 top-6 h-80 w-80 rotate-6 rounded-3xl bg-gradient-to-br from-emerald to-emerald/70 shadow-xl" />
          <div className="absolute left-10 top-24 h-72 w-72 -rotate-3 rounded-3xl bg-gradient-to-br from-terracotta to-terracotta-dark/80 shadow-xl" />
          <div className="absolute bottom-4 right-24 h-64 w-64 rotate-2 rounded-3xl border border-gold/40 bg-gradient-to-br from-sand to-ivory shadow-lg" />
          <blockquote className="absolute bottom-16 left-4 max-w-[240px] font-display text-2xl leading-snug text-ivory drop-shadow-lg">
            “The loom remembers what the hands forget.”
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
