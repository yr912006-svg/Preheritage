import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | PREHERITAGE",
  description: "Review PREHERITAGE insured shipping methods, delivery timeframes, tracking, and courier dispatch across India and internationally.",
  alternates: {
    canonical: "https://preheritage.com/shipping-policy",
  },
};

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-ivory-100 px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
      <article className="mx-auto max-w-4xl bg-ivory-50 px-5 py-8 text-sm leading-7 text-charcoal-700 sm:px-10 sm:py-12 sm:text-base">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.22em] text-gold-800">Store policy</p>
        <h1 className="border-b border-ivory-300 pb-5 font-serif text-3xl font-normal leading-tight text-charcoal-900 sm:text-4xl">
          Shipping & Delivery Policy
        </h1>

        <p>
          At <strong>PREHERITAGE</strong> (preheritage.com), delivery options and charges are shown during checkout. Delivery availability and timing depend on the destination and are confirmed after an order is placed.
        </p>

        <h2 className="mt-8 border-t border-ivory-300 pt-5 font-serif text-2xl font-medium text-charcoal-900">
          1. Domestic Shipping Charges (India)
        </h2>
        <ul className="list-disc space-y-2 pl-5 marker:text-gold-700">
          <li><strong>Complimentary Delivery:</strong> Available on all domestic orders valued at ₹4,999 and above.</li>
          <li><strong>Standard Shipping Fee:</strong> Flat ₹250 for orders below ₹4,999.</li>
          <li><strong>Delivery timing:</strong> The team will confirm the expected timing after dispatch.</li>
        </ul>

        <h2 className="mt-8 border-t border-ivory-300 pt-5 font-serif text-2xl font-medium text-charcoal-900">
          2. International Shipping (Global)
        </h2>
        <p>
          Contact the concierge to confirm international delivery availability, charges, and timing before placing an order. Customs duties or local import taxes, if applicable, are governed by the destination country&apos;s regulations.
        </p>

        <h2 className="mt-8 border-t border-ivory-300 pt-5 font-serif text-2xl font-medium text-charcoal-900">
          3. Packaging Integrity
        </h2>
        <p>
          Every PREHERITAGE order arrives in our signature gold-embossed ivory rigid gift box, enveloped in breathable unbleached muslin wrap, accompanied by our master weaver authenticity card and wax seal protection.
        </p>
      </article>
    </main>
  );
}
