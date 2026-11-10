"use client";

import React from "react";
import { Star, Quote } from "lucide-react";
import { TESTIMONIALS } from "@/lib/sample-data";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-[#FAF8F5] border-b border-[#E8DFC8] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={50}>
          <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-px w-6 bg-[#B08A45]" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#B08A45] font-semibold font-sans">
                PATRON VOICES
              </span>
              <span className="h-px w-6 bg-[#B08A45]" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#24201D] mb-4 leading-tight">
              Cherished by Connoisseurs Worldwide
            </h2>
            <p className="text-sm sm:text-base text-[#24201D]/75 font-light leading-relaxed">
              Patrons across Delhi, Mumbai, London, and New York share their reflections on PREHERITAGE single-loom treasures.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {TESTIMONIALS.map((test, index) => (
            <ScrollReveal
              key={test.id}
              direction="up"
              delayMs={index * 100}
              durationMs={700}
            >
              <div className="bg-[#F8F2E7] p-8 sm:p-9 rounded-xs border border-[#E8DFC8] hover:border-[#B08A45]/60 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg flex flex-col justify-between h-full relative group">
                <div>
                  <Quote className="w-8 h-8 text-[#B08A45]/40 mb-6 group-hover:text-[#B08A45]/70 transition-colors" />

                  <p className="font-serif italic text-base sm:text-lg text-[#24201D] leading-relaxed mb-6 font-normal">
                    {`“${test.quote}”`}
                  </p>
                </div>

                <div className="pt-5 border-t border-[#E8DFC8]">
                  <div className="flex items-center gap-1 text-[#B08A45] mb-2.5">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#B08A45] text-[#B08A45]" />
                    ))}
                  </div>

                  <div className="font-serif font-bold text-base text-[#24201D]">{test.author}</div>
                  <div className="text-xs text-[#B08A45] font-medium tracking-wide mt-0.5">{test.location}</div>
                  <div className="text-[11px] text-[#756A60] font-light mt-1.5 italic">
                    Wearing: {test.productName}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
