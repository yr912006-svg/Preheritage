import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Exchange Policy | PREHERITAGE",
  description: "Learn about PREHERITAGE 7-day heirloom return, exchange, and refund guidelines for authentic handcrafted Indian textiles.",
  alternates: {
    canonical: "https://preheritage.com/return-policy",
  },
};

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-ivory-100 px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <article className="mx-auto max-w-4xl bg-ivory-50 px-5 py-8 text-sm leading-7 text-charcoal-700 sm:px-10 sm:py-12 sm:text-base">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.22em] text-gold-800">Store policy</p>
        <h1 className="border-b border-ivory-300 pb-5 font-serif text-3xl font-normal leading-tight text-charcoal-900 sm:text-4xl">
          Return, Exchange & Refund Policy
        </h1>

        <p>
          We want you to be enchanted by your PREHERITAGE creation. Because our pieces are handwoven on authentic wooden pit looms by generational artisans, subtle variations in texture, yarn slub, or natural dye saturation are badges of authentic handcraft rather than defects.
        </p>

        <h2 className="mt-8 border-t border-ivory-300 pt-5 font-serif text-2xl font-medium text-charcoal-900">
          1. 7-Day Royal Exchange Guarantee
        </h2>
        <p>
          If you require a size adjustment or wish to exchange for another heritage hue, you may initiate an exchange request within <strong>7 days</strong> of delivery directly through your patron account dashboard at <a href="/account" className="text-gold-700 underline">preheritage.com/account</a> or by messaging our WhatsApp concierge desk.
        </p>

        <h2 className="mt-8 border-t border-ivory-300 pt-5 font-serif text-2xl font-medium text-charcoal-900">
          2. Reverse Pickup Facility
        </h2>
        <p>
          After an exchange request is approved, our team will confirm the return shipping arrangements. Please ensure the item is returned in its original condition, unworn, unwashed, with all original tags, muslin wraps, and box intact.
        </p>

        <h2 className="mt-8 border-t border-ivory-300 pt-5 font-serif text-2xl font-medium text-charcoal-900">
          3. Refund Processing
        </h2>
        <p>
          In the rare event of transit damage or manufacturing discrepancy, upon receiving and inspecting the returned piece at our atelier, refunds are initiated within 48 hours back to the original source (Razorpay UPI, Card, NetBanking). For Cash on Delivery orders, refunds are credited directly to your verified bank account via NEFT/IMPS.
        </p>
      </article>
    </main>
  );
}
