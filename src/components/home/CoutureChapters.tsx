"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass } from "lucide-react";

interface Chapter {
  id: string;
  numeral: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  link: string;
  badge: string;
}

const chapters: Chapter[] = [
  {
    id: "chapter-1",
    numeral: "CHAPTER I",
    title: "The Saree Vault",
    subtitle: "Sacred Unstitched Poetry",
    description: "Varanasi Katan silks, Tanchoi weaves, and architectural Kadwa gold borders woven on traditional pit-looms.",
    imageUrl: "/images/campaign/couture-saree-mineral.jpg",
    link: "/shop?category=sarees",
    badge: "Haute Silk",
  },
  {
    id: "chapter-2",
    numeral: "CHAPTER II",
    title: "Imperial Menswear",
    subtitle: "The Royal Silhouette",
    description: "Tailored raw silk-cotton kurtas, textured handloom Nehru waistcoats, and ceremonial stoles.",
    imageUrl: "/images/campaign/imperial-menswear-ivory.jpg",
    link: "/collections/mens-ethnic-wear",
    badge: "Bespoke Tailoring",
  },
  {
    id: "chapter-3",
    numeral: "CHAPTER III",
    title: "Occasion & Evening Couture",
    subtitle: "Twilight Galas & Heirloom Lehengas",
    description: "Muted burgundy velvets, antique gold zardozi metal embroidery, and dramatic ceremonial drapes.",
    imageUrl: "/images/campaign/occasion-burgundy-gala.jpg",
    link: "/shop?category=lehengas",
    badge: "Zardozi Atelier",
  },
  {
    id: "chapter-4",
    numeral: "CHAPTER IV",
    title: "Rare Weaves & Master Stoles",
    subtitle: "Purity of the Golden Filament",
    description: "Pure Kashmir Pashmina, gossamer Bengal Jamdani, and certified regional master-loom textiles.",
    imageUrl: "/images/campaign/fluid-silk-zari-movement.jpg",
    link: "/shop?category=handloom",
    badge: "Artisan Lineage",
  },
];

export const CoutureChapters: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-ivory text-charcoal relative border-b border-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-stone-300 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-gold" />
              <span className="text-[10.5px] uppercase tracking-[0.25em] font-medium text-stone-500">
                Curated Haute Editions
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-charcoal tracking-tight">
              The Couture Chapters
            </h2>
          </div>
          <div className="max-w-md">
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
              Each chapter represents a dedicated sanctuary of Indian master-weaving, categorized by craft lineage, raw textile purity, and ceremonial provenance.
            </p>
          </div>
        </div>

        {/* Editorial Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {chapters.map((chapter, index) => (
            <Link
              key={chapter.id}
              href={chapter.link}
              className="group block relative bg-stone-100/50 border border-stone-200 overflow-hidden transition-all duration-500 hover:border-gold hover:shadow-luxury-lg"
            >
              {/* Image Container with Art-Directed Ratio */}
              <div className="relative aspect-[4/5] sm:aspect-[3/4] w-full overflow-hidden bg-stone-200">
                <Image
                  src={chapter.imageUrl}
                  alt={chapter.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  quality={90}
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14110F]/95 via-[#14110F]/55 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />

                {/* Top Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 bg-ivory/90 backdrop-blur-sm text-charcoal text-[10px] uppercase tracking-[0.2em] font-semibold">
                    {chapter.badge}
                  </span>
                </div>

                {/* Numeral Marker */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="text-ivory/80 font-mono text-xs tracking-widest uppercase">
                    {chapter.numeral}
                  </span>
                </div>

                {/* Bottom Overlay Content */}
                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 z-10 text-ivory">
                  <p className="text-gold text-[11px] uppercase tracking-[0.2em] font-medium mb-1">
                    {chapter.subtitle}
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal mb-2 text-ivory">
                    {chapter.title}
                  </h3>
                  <p className="text-stone-300 text-xs sm:text-sm line-clamp-2 font-light leading-relaxed mb-4">
                    {chapter.description}
                  </p>
                  <div className="inline-flex min-h-[44px] items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-ivory font-medium border-b border-gold/70 pb-1 group-hover:text-gold group-hover:border-gold transition-colors duration-200">
                    <span>Examine Chapter</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoutureChapters;
