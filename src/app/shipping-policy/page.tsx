import React from "react";

export const metadata = {
  title: "Shipping & Delivery Policy | PREHERITAGE",
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 bg-ivory-50 p-8 sm:p-12 rounded border border-ivory-300 shadow-sm space-y-6 text-xs sm:text-sm text-charcoal-200 leading-relaxed font-light">
        <h1 className="font-serif text-3xl font-bold text-charcoal-900 pb-4 border-b border-ivory-300">
          Shipping & Insured Transit Policy
        </h1>

        <p>
          At <strong>PREHERITAGE</strong> (preheritage.com), each handcrafted saree, kurta set, lehenga, and pashmina shawl is an irreplaceable artisanal creation. We ensure that every piece is handled with the utmost royal care and dispatched through our trusted logistics partners including Shiprocket Priority, Delhivery Air, and DHL Express.
        </p>

        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-4">
          1. Domestic Shipping Timelines (India)
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Complimentary Delivery:</strong> Available on all domestic orders valued at ₹4,999 and above.</li>
          <li><strong>Standard Shipping Fee:</strong> Flat ₹250 for orders below ₹4,999.</li>
          <li><strong>Dispatch Window:</strong> Ready-to-ship heritage items dispatch within 24 to 48 business hours.</li>
          <li><strong>Transit Duration:</strong> Metro cities: 2-3 business days. Non-metro locations: 3-5 business days.</li>
        </ul>

        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-4">
          2. International Shipping (Global)
        </h2>
        <p>
          We deliver to the United States, United Kingdom, Canada, United Arab Emirates, Singapore, Australia, and over 40 countries worldwide via DHL Express. International transit typically takes 5 to 7 business days following dispatch. Custom duties or local import taxes, if applicable, are governed by the destination country&apos;s regulations.
        </p>

        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-4">
          3. Packaging Integrity
        </h2>
        <p>
          Every PREHERITAGE order arrives in our signature gold-embossed ivory rigid gift box, enveloped in breathable unbleached muslin wrap, accompanied by our master weaver authenticity card and wax seal protection.
        </p>
      </div>
    </div>
  );
}
