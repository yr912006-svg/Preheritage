"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Shield, HeartHandshake, Compass } from "lucide-react";

export const TheAtelierMemoir: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#181512] text-ivory relative border-b border-stone-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Documentary Photography */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full border border-stone-700 bg-stone-900 shadow-2xl overflow-hidden group">
              <Image
                src="/images/campaign/artisan-master-loom.jpg"
                alt="Indian Master Weaver at Traditional Pit Loom in Varanasi"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={90}
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-charcoal/80 backdrop-blur-sm p-4 border border-stone-700">
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold font-medium">
                  Documented in Varanasi, Uttar Pradesh
                </p>
                <p className="font-serif italic text-sm text-stone-200 mt-1">
                  Master craftsman coordinating fine silk warp cords on a traditional wooden pit-loom.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Memoir & Values */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-[10.5px] uppercase tracking-[0.25em] font-medium text-gold">
                The Atelier &amp; Lineage
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-light text-ivory tracking-tight leading-tight">
              Don’t Just Wear Heritage. <br />
              <span className="italic text-stone-300">Carry It Forward.</span>
            </h2>

            <div className="border-l-2 border-gold/60 pl-5 space-y-3">
              <p className="font-serif italic text-xl text-gold-300 font-light">
                “Every thread laid down on our looms carries the living memory of the hands that passed before us.”
              </p>
              <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed">
                PREHERITAGE was founded with a singular conviction: that India’s sacred handloom heritage belongs on the highest international luxury stages, without compromise, synthetic dilution, or anonymous artisan exploitation.
              </p>
            </div>

            {/* Three Atelier Pillars */}
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0 text-gold">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm uppercase tracking-[0.18em] font-medium text-ivory">
                    Direct Artisan Guild Support
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed mt-1">
                    Partnering directly with generational weaving families so master artisans receive dignity, credit, and fair compensation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-9 w-9 bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0 text-gold">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm uppercase tracking-[0.18em] font-medium text-ivory">
                    Living Weaving Lineage
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed mt-1">
                    Preserving intricate Kadwa and Tanchoi patterns that exist in the rhythmic memory of generational pit-loom masters.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-9 w-9 bg-stone-900 border border-stone-800 flex items-center justify-center shrink-0 text-gold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm uppercase tracking-[0.18em] font-medium text-ivory">
                    Purity of Traditional Weft
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed mt-1">
                    Authentic wooden pit-loom craftsmanship, hand-guided tension, and coordinated antique gold-tone zari motifs inspired by Varanasi's historic design archives.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex min-h-[48px] items-center gap-3 px-8 py-3.5 bg-ivory text-charcoal text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-gold hover:text-charcoal transition-all duration-300"
              >
                <span>Read The Full Memoir</span>
                <ArrowRight className="w-4 h-4 text-charcoal" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TheAtelierMemoir;

