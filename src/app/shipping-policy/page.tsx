import React from "react";

export const metadata = {
  title: "Shipping & Delivery Policy | PREHERITAGE",
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 bg-ivory-50 p-8 sm:p-12 rounded border border-ivory-300 shadow-sm space-y-6 text-xs sm:text-sm text-charcoal-200 leading-relaxed font-light">
        <h1 className="font-serif text-3xl font-bold text-charcoal-900 pb-4 border-b border-ivory-300">
          Shipping & Delivery Policy
        </h1>

        <p>
          At <strong>PREHERITAGE</strong> (preheritage.com), delivery options and charges are shown during checkout. Delivery availability and timing depend on the destination and are confirmed after an order is placed.
        </p>

        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-4">
          1. Domestic Shipping Charges (India)
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Complimentary Delivery:</strong> Available on all domestic orders valued at ₹4,999 and above.</li>
          <li><strong>Standard Shipping Fee:</strong> Flat ₹250 for orders below ₹4,999.</li>
          <li><strong>Delivery timing:</strong> The team will confirm the expected timing after dispatch.</li>
        </ul>

        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-4">
          2. International Shipping (Global)
        </h2>
        <p>
          Contact the concierge to confirm international delivery availability, charges, and timing before placing an order. Customs duties or local import taxes, if applicable, are governed by the destination country&apos;s regulations.
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
