import React from "react";
import { Star, Quote } from "lucide-react";
import { TESTIMONIALS } from "@/lib/sample-data";

export const Testimonials: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-ivory-100 border-b border-ivory-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.24em] text-gold-600 font-semibold font-sans block mb-2">
            Patron Voices
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-4">
            Cherished by Connoisseurs Worldwide
          </h2>
          <p className="text-sm text-charcoal-200 font-light">
            Read what collectors and heritage lovers in India, the US, and the UK have to say about the Preheritage experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((test) => (
            <div
              key={test.id}
              className="bg-ivory-50 p-8 rounded-sm border border-ivory-200 shadow-luxury flex flex-col justify-between relative"
            >
              <Quote className="w-8 h-8 text-gold-300/60 mb-4" />

              <p className="font-serif italic text-base sm:text-lg text-charcoal-800 leading-relaxed mb-6">
                &ldquo;{test.quote}&rdquo;
              </p>

              <div className="pt-4 border-t border-ivory-200">
                <div className="flex items-center gap-1 text-amber-500 mb-2">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>

                <div className="font-semibold text-sm text-charcoal-900">{test.author}</div>
                <div className="text-xs text-gold-700 font-medium">{test.location}</div>
                <div className="text-[11px] text-charcoal-100 font-light mt-1">
                  Wearing: {test.productName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
