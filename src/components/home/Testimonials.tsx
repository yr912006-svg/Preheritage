import React from "react";
import { Star, Quote } from "lucide-react";
import { TESTIMONIALS } from "@/lib/sample-data";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-white border-b border-ivory-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={50}>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.26em] text-gold-600 font-semibold font-sans block mb-2">
              Patron Voices
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal-900 mb-4 leading-tight">
              Cherished by Connoisseurs Worldwide
            </h2>
            <p className="text-sm text-charcoal-50 font-light leading-relaxed">
              Patrons across Delhi, Mumbai, London, and New York share their reflections on PREHERITAGE single-loom treasures.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((test, index) => (
            <ScrollReveal
              key={test.id}
              direction="up"
              delayMs={index * 120}
              durationMs={700}
            >
              <div className="bg-ivory-50 p-8 rounded-xs border border-ivory-300 shadow-luxury hover:shadow-luxury-lg transition-all duration-300 flex flex-col justify-between h-full relative">
                <div>
                  <Quote className="w-7 h-7 text-gold-400/50 mb-5" />

                  <p className="font-serif italic text-base sm:text-lg text-charcoal-900 leading-relaxed mb-6 font-light">
                    &ldquo;{test.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-5 border-t border-ivory-200">
                  <div className="flex items-center gap-1 text-gold-500 mb-2.5">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                    ))}
                  </div>

                  <div className="font-medium text-sm text-charcoal-900">{test.author}</div>
                  <div className="text-xs text-gold-700 font-medium">{test.location}</div>
                  <div className="text-[11px] text-charcoal-50 font-light mt-1">
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
