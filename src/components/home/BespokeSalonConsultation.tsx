"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Calendar, Sparkles, ArrowRight } from "lucide-react";
import { WhatsAppContactLink } from "@/components/contact/WhatsAppContactLink";

export const BespokeSalonConsultation: React.FC = () => {
  return (
    <section className="py-16 sm:py-24 bg-[#14110F] text-ivory relative border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-stone-800 bg-[#1A1714] p-8 sm:p-14 relative overflow-hidden">
          {/* Subtle Panoramic Maison Backdrop */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <Image
              src="/images/campaign/panoramic-maison-twilight.jpg"
              alt="PREHERITAGE Maison Twilight Campaign"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1714] via-[#1A1714]/85 to-[#1A1714]" />
          </div>

          {/* Subtle gold accent frame */}
          <div className="absolute top-0 left-0 w-24 h-[2px] bg-gold z-10" />
          <div className="absolute bottom-0 right-0 w-24 h-[2px] bg-gold z-10" />

          <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>Private Client Salon &amp; Bespoke Commissions</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-light text-ivory tracking-tight">
              Commission an Heirloom for Posterity
            </h2>

            <p className="font-serif italic text-lg sm:text-xl text-stone-300 font-light">
              “Every bride, collector, and patron deserves an unrepeatable piece woven solely for their lineage.”
            </p>

            <p className="text-xs sm:text-sm text-stone-400 font-light leading-relaxed max-w-xl mx-auto">
              Our master weavers accept a limited number of bespoke commissions annually. Connect with our atelier directors to select handloom warp specifications, custom zari motifs, and inscribed pallus.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <WhatsAppContactLink
                className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center gap-3 px-8 py-3.5 bg-ivory text-charcoal text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-gold hover:text-charcoal transition-all duration-300"
                message="Hello PREHERITAGE Concierge, I would like to schedule a private consultation for a bespoke heirloom piece."
                fallbackHref="/contact"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Atelier WhatsApp Concierge</span>
              </WhatsAppContactLink>

              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3.5 border border-stone-700 text-ivory text-[11px] uppercase tracking-[0.2em] font-medium hover:border-gold hover:text-gold transition-colors duration-200"
              >
                <Calendar className="w-4 h-4 text-stone-400" />
                <span>Reserve Digital Salon</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BespokeSalonConsultation;
