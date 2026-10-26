import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart, MapPin, ArrowRight } from "lucide-react";

export const metadata = {
  title: "The Preheritage Memoir | Wear the Stories of India",
  description: "Learn about PREHERITAGE, our mission, GI-certified artisan clusters, and quiet luxury Indian fashion.",
};

export default function AboutPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-gold-600 font-bold block mb-2">
            The Preheritage Memoir
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-charcoal-900 leading-tight mb-4">
            Don’t Just Wear Heritage. <br />
            <span className="italic font-normal text-gold-700">Carry It Forward.</span>
          </h1>
          <p className="font-serif italic text-xl text-charcoal-300">
            &ldquo;Many Stories. One Thread.&rdquo;
          </p>
        </div>

        {/* Narrative Image */}
        <div className="relative aspect-[16/9] w-full rounded-sm overflow-hidden border-4 border-ivory-50 shadow-luxury">
          <Image
            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=1600"
            alt="Handcrafted Indian Heritage Textiles"
            fill
            className="object-cover"
          />
        </div>

        {/* Brand Philosophy Sections */}
        <div className="bg-ivory-50 p-8 sm:p-12 rounded-sm border border-ivory-300 shadow-sm space-y-8 text-charcoal-200 text-sm sm:text-base leading-relaxed font-light">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 mb-3">
              The Genesis of PREHERITAGE
            </h2>
            <p>
              India is not a land of mass production; it is an epic continent of living, breathing handlooms. For over five millennia, from the sacred riverbank pit looms of Varanasi to the high snow meadows of Kashmir, Indian artisans have turned organic mulberry silk, Himalayan cashmere, and fine handspun cotton into legendary works of wearable art.
            </p>
            <p className="mt-3">
              Yet in an era dominated by synthetic polyester and industrialized fast fashion, these ancestral lineages faced dilution. PREHERITAGE was born out of an uncompromising reverence: to curate, honor, and elevate India’s master artisans onto the global luxury stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-ivory-300">
            <div className="p-5 bg-ivory-100 rounded border border-ivory-200">
              <span className="font-serif text-lg font-bold text-charcoal-900 block mb-1">
                Indian Soul
              </span>
              <p className="text-xs text-charcoal-100">
                Rooted deeply in sacred weaving geometries, temple iconography, and authentic regional techniques.
              </p>
            </div>

            <div className="p-5 bg-ivory-100 rounded border border-ivory-200">
              <span className="font-serif text-lg font-bold text-charcoal-900 block mb-1">
                Global Luxury
              </span>
              <p className="text-xs text-charcoal-100">
                Impeccably tailored, uncompromised finishings, signature wax-sealed hardbox packaging, and worldwide delivery.
              </p>
            </div>

            <div className="p-5 bg-ivory-100 rounded border border-ivory-200">
              <span className="font-serif text-lg font-bold text-charcoal-900 block mb-1">
                Timeless Elegance
              </span>
              <p className="text-xs text-charcoal-100">
                Heirloom creations designed to transcend fleeting seasonal trends and be cherished across generations.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-2">
              Our Artisan Commitment
            </h3>
            <p>
              Every saree, kurta, lehenga, and shawl in our collection is Silk Mark or GI certified. We ensure fair generational wages, ethical workshop environments, and transparent attribution directly to the master weavers.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-[0.2em] font-semibold transition-colors rounded shadow-luxury"
          >
            <span>Explore The Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
