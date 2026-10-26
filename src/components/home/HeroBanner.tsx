"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

export const HeroBanner: React.FC = () => {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center bg-charcoal-950 overflow-hidden">
      {/* Background Hero Imagery with Luxury Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=2000"
          alt="PREHERITAGE Indian Cultural Luxury Fashion"
          fill
          priority
          className="object-cover object-center opacity-40 scale-105 animate-pulse duration-[10000ms]"
        />
        {/* Subtle Radial Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/60 to-charcoal-950/40" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-ivory-50 py-20 flex flex-col items-center">
        {/* Royal Crest Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-950/80 border border-gold-600/50 text-gold-300 text-[11px] sm:text-xs tracking-[0.25em] uppercase font-sans mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>Indian Soul. Global Luxury. Timeless Elegance.</span>
        </div>

        {/* Master Brand Typography */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.12em] uppercase text-ivory-50 leading-tight">
          PREHERITAGE
        </h1>

        <p className="font-serif italic text-xl sm:text-3xl md:text-4xl text-gold-200 mt-3 font-normal tracking-wide">
          Wear the Stories of India
        </p>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-ivory-300 mt-6 font-light leading-relaxed tracking-wide font-sans">
          Don’t Just Wear Heritage. Carry It Forward. From the sacred pit looms of Varanasi to the snow-bound valleys of Kashmir — each creation carries centuries of living Indian craftsmanship.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/shop"
            className="w-full sm:w-auto px-8 py-4 bg-gold-500 hover:bg-gold-600 text-charcoal-950 text-xs uppercase tracking-[0.22em] font-semibold flex items-center justify-center gap-3 transition-all duration-300 rounded-xs shadow-gold hover:translate-y-[-2px]"
          >
            <span>Explore Handcrafted Silks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/shop?badge=BESTSELLER"
            className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-ivory-100/10 text-ivory-100 border border-gold-500/60 text-xs uppercase tracking-[0.22em] font-medium flex items-center justify-center gap-2 transition-all duration-300 rounded-xs"
          >
            <span>Bestsellers</span>
          </Link>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-12 border-t border-charcoal-800/80 pt-8 w-full max-w-4xl text-left">
          <div>
            <span className="block font-serif text-xl sm:text-2xl font-bold text-gold-400">100%</span>
            <span className="text-[11px] uppercase tracking-wider text-ivory-400">GI-Certified Weaves</span>
          </div>
          <div>
            <span className="block font-serif text-xl sm:text-2xl font-bold text-gold-400">500+</span>
            <span className="text-[11px] uppercase tracking-wider text-ivory-400">Master Artisans</span>
          </div>
          <div>
            <span className="block font-serif text-xl sm:text-2xl font-bold text-gold-400">28 States</span>
            <span className="text-[11px] uppercase tracking-wider text-ivory-400">Handcraft Lineages</span>
          </div>
          <div>
            <span className="block font-serif text-xl sm:text-2xl font-bold text-gold-400">Global</span>
            <span className="text-[11px] uppercase tracking-wider text-ivory-400">Insured Delivery</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
