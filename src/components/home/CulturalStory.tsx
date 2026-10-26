import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const CulturalStory: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-ivory-100 border-b border-ivory-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Visual Showcase: Left */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] w-full rounded-sm overflow-hidden shadow-2xl border-4 border-ivory-50">
              <Image
                src="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&q=80&w=1200"
                alt="Master Artisan weaving on traditional Indian wooden pit loom"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Floating Luxury Story Badge */}
            <div className="absolute -bottom-6 -right-4 sm:-right-8 bg-charcoal-900 text-ivory-50 p-6 rounded-sm shadow-xl max-w-xs border border-gold-500/40 hidden sm:block">
              <span className="text-[10px] tracking-[0.25em] uppercase text-gold-400 font-bold block mb-1">
                Sacred Craft
              </span>
              <p className="font-serif text-lg italic text-ivory-100">
                &ldquo;A single Varanasi Katan saree requires up to 180 days of patient hand-knotting.&rdquo;
              </p>
            </div>
          </div>

          {/* Narrative Content: Right */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-gold-600 font-semibold font-sans">
              <span>The Philosophy of Preheritage</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 leading-tight">
              Many Stories. <br />
              <span className="italic font-normal text-gold-700">One Thread.</span>
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-charcoal-200 leading-relaxed font-light">
              <p>
                In an era of relentless fast fashion and synthetic replicas, PREHERITAGE was founded on a reverent commitment: to revive, celebrate, and carry forward India&apos;s royal weaving traditions for the modern world.
              </p>
              <p>
                Every fold of pure Katan silk, every touch of Changthangi cashmere, and every stroke of Ajrakh natural block print is an unbroken dialogue with centuries of generational master artisans.
              </p>
              <blockquote className="border-l-2 border-gold-500 pl-4 py-1 italic font-serif text-charcoal-800 text-lg">
                &ldquo;Don’t Just Wear Heritage. Carry It Forward.&rdquo;
              </blockquote>
              <p>
                When you choose Preheritage, you are not merely purchasing attire. You are preserving an ancient art form, empowering weaver families across 28 Indian states, and donning a piece of living history.
              </p>
            </div>

            <div className="pt-4 flex items-center gap-6">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-charcoal-900 hover:text-gold-600 transition-colors border-b-2 border-charcoal-900 hover:border-gold-600 pb-1"
              >
                <span>Read The Full Heritage Memoir</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CulturalStory;
