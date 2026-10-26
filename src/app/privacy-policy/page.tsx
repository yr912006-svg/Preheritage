import React from "react";

export const metadata = {
  title: "Privacy Policy | PREHERITAGE",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 bg-ivory-50 p-8 sm:p-12 rounded border border-ivory-300 shadow-sm space-y-6 text-xs sm:text-sm text-charcoal-200 leading-relaxed font-light">
        <h1 className="font-serif text-3xl font-bold text-charcoal-900 pb-4 border-b border-ivory-300">
          Privacy & Data Protection Policy
        </h1>
        <p>
          PREHERITAGE (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates preheritage.com. We respect your privacy and are committed to safeguarding your personal data in full compliance with Indian Information Technology Act (2000), Digital Personal Data Protection Act (DPDP), and international GDPR guidelines.
        </p>
        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-2">
          1. Information We Collect
        </h2>
        <p>
          We collect your name, email, contact telephone number, shipping and billing addresses, and order records solely for processing transactions, coordinating delivery via courier partners, and sending SMS tracking notifications. We do not store credit card or net banking CVVs/passwords; all financial transactions are processed securely through RBI-licensed payment gateways (Razorpay).
        </p>
        <h2 className="font-serif text-xl font-bold text-charcoal-900 pt-2">
          2. No Data Selling
        </h2>
        <p>
          Your personal data is treated with the discretion expected of royal ateliers. We do not rent, sell, or trade patron contact information to third-party marketing entities.
        </p>
      </div>
    </div>
  );
}
