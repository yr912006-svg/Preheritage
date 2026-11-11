"use client";

import React from "react";
import Image from "next/image";
import ScrollReveal from "@/components/ui/ScrollReveal";

export type StorefrontPoster = {
  id: string;
  title: string;
  imageUrl: string;
  description: string | null;
};

export default function ArtHeritage({ posters }: { posters: StorefrontPoster[] }) {
  if (posters.length === 0) return null;

  return (
    <section aria-labelledby="art-heritage-heading" className="bg-charcoal-950 px-4 py-16 text-ivory-50 sm:px-6 sm:py-20 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal direction="up" delayMs={50}>
          <header className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold-400">Stories in every detail</p>
            <h2 id="art-heritage-heading" className="mt-3 font-serif text-3xl font-bold sm:text-4xl text-ivory-50">Art &amp; Heritage</h2>
          </header>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posters.map((poster, index) => (
            <ScrollReveal
              key={poster.id}
              direction="up"
              delayMs={(index % 3) * 100}
              durationMs={700}
            >
              <article className="group overflow-hidden rounded-sm border border-charcoal-700 bg-charcoal-900/70 transition-all duration-400 hover:border-gold-500/60 hover:-translate-y-1 hover:shadow-2xl">
                <div className="relative aspect-[4/5] overflow-hidden bg-charcoal-800">
                  <Image
                    src={poster.imageUrl}
                    alt={poster.title}
                    fill
                    unoptimized={poster.imageUrl.startsWith("/api/storage/")}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="font-serif text-xl font-semibold text-ivory-50 group-hover:text-gold-300 transition-colors">{poster.title}</h3>
                  {poster.description && <p className="mt-2 text-sm leading-relaxed text-ivory-300 font-light">{poster.description}</p>}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
