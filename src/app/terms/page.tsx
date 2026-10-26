import React from "react";

export const metadata = {
  title: "Terms and Conditions | PREHERITAGE",
};

export default function TermsPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 bg-ivory-50 p-8 sm:p-12 rounded border border-ivory-300 shadow-sm space-y-6 text-xs sm:text-sm text-charcoal-200 leading-relaxed font-light">
        <h1 className="font-serif text-3xl font-bold text-charcoal-900 pb-4 border-b border-ivory-300">
          Terms & Conditions of Service
        </h1>
        <p>
          Welcome to PREHERITAGE (preheritage.com). By visiting our website or purchasing our handcrafted garments and artifacts, you engage in our service and agree to be bound by the following terms and conditions.
        </p>
        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-2">
          1. Handloom Product Nature
        </h2>
        <p>
          Our products are authentic handloom and artisanal goods. Due to the nature of manual pit-loom weaving, wooden handblock printing, and natural vegetable dyeing, subtle irregularities are natural characteristics of authentic craftsmanship and attest to their handmade origin.
        </p>
        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-2">
          2. Intellectual Property
        </h2>
        <p>
          All content, photographs, cultural narratives, trademarks, brand taglines (&ldquo;Wear the Stories of India&rdquo;, &ldquo;Many Stories. One Thread.&rdquo;), and logo graphics are the exclusive intellectual property of PREHERITAGE.
        </p>
      </div>
    </div>
  );
}
