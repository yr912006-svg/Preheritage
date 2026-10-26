import React from "react";

export const metadata = {
  title: "Return & Exchange Policy | PREHERITAGE",
};

export default function ReturnPolicyPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 bg-ivory-50 p-8 sm:p-12 rounded border border-ivory-300 shadow-sm space-y-6 text-xs sm:text-sm text-charcoal-200 leading-relaxed font-light">
        <h1 className="font-serif text-3xl font-bold text-charcoal-900 pb-4 border-b border-ivory-300">
          Return, Exchange & Refund Policy
        </h1>

        <p>
          We want you to be enchanted by your PREHERITAGE creation. Because our pieces are handwoven on authentic wooden pit looms by generational artisans, subtle variations in texture, yarn slub, or natural dye saturation are badges of authentic handcraft rather than defects.
        </p>

        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-4">
          1. 7-Day Royal Exchange Guarantee
        </h2>
        <p>
          If you require a size adjustment or wish to exchange for another heritage hue, you may initiate an exchange request within <strong>7 days</strong> of delivery directly through your patron account dashboard at <a href="/account" className="text-gold-700 underline">preheritage.com/account</a> or by messaging our WhatsApp concierge desk.
        </p>

        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-4">
          2. Reverse Pickup Facility
        </h2>
        <p>
          Upon approval of your exchange request, we arrange a complimentary reverse courier pickup right from your doorstep via Shiprocket. Please ensure the item is returned in its original condition, unworn, unwashed, with all original tags, muslin wraps, and box intact.
        </p>

        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-4">
          3. Refund Processing
        </h2>
        <p>
          In the rare event of transit damage or manufacturing discrepancy, upon receiving and inspecting the returned piece at our atelier, refunds are initiated within 48 hours back to the original source (Razorpay UPI, Card, NetBanking). For Cash on Delivery orders, refunds are credited directly to your verified bank account via NEFT/IMPS.
        </p>
      </div>
    </div>
  );
}
