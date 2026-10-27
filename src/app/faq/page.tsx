"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How do I know that the silks and pashminas are 100% authentic?",
    a: "Every pure silk saree and garment at PREHERITAGE carries Silk Mark Organization of India certification. Our Kashmir shawls are made from genuine Changthangi GI-certified cashmere. Each piece is shipped with its official weaver provenance card.",
  },
  {
    q: "Do sarees come with a matching blouse piece?",
    a: "Yes. All our sarees are woven with an unstitched 0.8m to 1.0m matching blouse fabric piece attached at the end of the pallu, matching the border embroidery or zari motif.",
  },
  {
    q: "Can I request customized tailoring for kurtas or lehengas?",
    a: "Absolutely. We offer customized bespoke tailoring. Once you place an order, our WhatsApp concierge will reach out to note your exact measurement requirements.",
  },
  {
    q: "What payment methods are supported on PREHERITAGE?",
    a: "Cash on Delivery is available. Other payment options are shown at checkout when the payment gateway is configured.",
  },
  {
    q: "How do I care for my antique zari and pure silk sarees?",
    a: "We strongly recommend dry cleaning only for all pure silks and cashmere. Store wrapped in the breathable unbleached muslin cloth provided in your signature box, away from plastic bags and direct sunlight.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery options and charges are displayed at checkout. Availability and timing depend on the destination; tracking details are shared after dispatch when available.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-gold-600 font-bold block mb-1">
            Atelier Knowledge
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-100 font-light max-w-lg mx-auto">
            Everything you need to know about our heirloom weaves, certifications, sizing, and deliveries.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-ivory-50 rounded-sm border border-ivory-300 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex justify-between items-center gap-4 hover:bg-ivory-100/60 transition-colors"
                >
                  <span className="font-serif font-bold text-base text-charcoal-900">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gold-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-charcoal-100 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs sm:text-sm text-charcoal-200 leading-relaxed font-light border-t border-ivory-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
