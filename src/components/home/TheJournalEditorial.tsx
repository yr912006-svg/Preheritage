"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  readTime: string;
  excerpt: string;
  imageUrl: string;
  slug: string;
}

const entries: JournalEntry[] = [
  {
    id: "kadwa-geometry",
    title: "The Geometry of Kadwa",
    subtitle: "Why Hand-Drawn Loom Graphs Can Never Be Replaced",
    tag: "Varanasi Archives",
    readTime: "6 Min Read",
    excerpt: "Unlike continuous jacquards where extra weft floats across the back, Kadwa requires the artisan to fasten each gold motif individually.",
    imageUrl: "/images/editorial/journal-kadwa-weave.jpg",
    slug: "kadwa-weave",
  },
  {
    id: "pashmina-lineage",
    title: "The Pashmina Lineage",
    subtitle: "From Changthang Nomads to Ceremonial Heirloom Wraps",
    tag: "Kashmir Highlands",
    readTime: "8 Min Read",
    excerpt: "At 14,000 feet above sea level, the Changra goat produces underfleece six times finer than human hair, spun by hand into unmeasured warmth.",
    imageUrl: "/images/editorial/journal-pashmina-lineage.jpg",
    slug: "pashmina-lineage",
  },
  {
    id: "desert-indigo",
    title: "Desert Indigo Alchemy",
    subtitle: "The 24-Day Fermentation of Sacred Natural Vats",
    tag: "Kutch Craft",
    readTime: "5 Min Read",
    excerpt: "In the salt deserts of Western India, master dyers nurture live bacterial fermentation vats that breathe, feeding on jaggery and water.",
    imageUrl: "/images/editorial/journal-desert-indigo.jpg",
    slug: "desert-indigo",
  },
];

export const TheJournalEditorial: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-ivory text-charcoal border-b border-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-stone-300 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-gold" />
              <span className="text-[10.5px] uppercase tracking-[0.25em] font-medium text-stone-500">
                The Maison Journal
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-charcoal tracking-tight">
              Chronicles &amp; Loom Essays
            </h2>
          </div>
          <div>
            <Link
              href="/journal"
              className="inline-flex min-h-[44px] items-center gap-2 px-2 text-xs uppercase tracking-[0.2em] font-medium text-charcoal hover:text-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <span>Examine All Essays</span>
              <ArrowRight className="w-4 h-4 text-gold" />
            </Link>
          </div>
        </div>

        {/* 3-Column Magazine Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href="/journal"
              className="group block bg-white border border-stone-200 overflow-hidden hover:border-gold hover:shadow-luxury transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 border-b border-stone-200">
                  <Image
                    src={entry.imageUrl}
                    alt={entry.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    quality={85}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 bg-charcoal/85 backdrop-blur-sm text-ivory text-[9.5px] uppercase tracking-[0.2em] px-2.5 py-1">
                    {entry.tag}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono tracking-wider mb-2">
                    <span>ESSAY</span>
                    <span>{entry.readTime}</span>
                  </div>

                  <h3 className="font-serif text-2xl font-normal text-charcoal mb-2 group-hover:text-gold transition-colors duration-200">
                    {entry.title}
                  </h3>

                  <p className="font-serif italic text-xs text-stone-500 mb-3">
                    {entry.subtitle}
                  </p>

                  <p className="text-stone-600 text-xs font-light leading-relaxed line-clamp-3">
                    {entry.excerpt}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-medium text-charcoal group-hover:text-gold transition-colors">
                  <span>Read Memoir</span>
                  <ArrowRight className="w-3 h-3 text-gold group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TheJournalEditorial;

