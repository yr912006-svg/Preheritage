import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | PREHERITAGE",
  description:
    "Find answers to common questions about PREHERITAGE handloom provenance, saree blouse tailoring, care instructions, insured shipping, and returns.",
  openGraph: {
    title: "Frequently Asked Questions | PREHERITAGE",
    description:
      "Find answers to common questions about PREHERITAGE handloom provenance, saree blouse tailoring, care instructions, insured shipping, and returns.",
    url: "https://preheritage.com/faq",
  },
  alternates: {
    canonical: "https://preheritage.com/faq",
  },
};

const groups = [
  {
    title: "Product details & care",
    questions: [
      {
        q: "How can I learn about a product’s materials or provenance?",
        a: "Details vary by piece. Review the product page for the material, craft, and other information provided for that item. If you need clarification, please contact us before ordering.",
      },
      {
        q: "Do sarees include a matching blouse piece?",
        a: "Please check the size and fit information on the individual product page. Inclusions can vary by piece.",
      },
      {
        q: "Can I request customized tailoring?",
        a: "Customization availability depends on the piece. Contact us with the product name and your question, and we can advise based on the information available.",
      },
      {
        q: "How should I care for my purchase?",
        a: "Care guidance is product-specific. Use the care instructions on that product’s page, and contact us if you need clarification.",
      },
    ],
  },
  {
    title: "Orders & policies",
    questions: [
      {
        q: "What payment methods are available?",
        a: "Cash on Delivery is available. Other payment options are shown at checkout when the payment gateway is configured.",
      },
      {
        q: "How long does delivery take?",
        a: <>Delivery options and charges are displayed at checkout. Availability and timing depend on the destination. Please see the <Link href="/shipping-policy" className="font-semibold text-gold-800 underline underline-offset-4">Shipping &amp; Delivery Policy</Link> for details.</>,
      },
      {
        q: "How do I request an exchange or refund?",
        a: <>Please review the current <Link href="/return-policy" className="font-semibold text-gold-800 underline underline-offset-4">Return, Exchange &amp; Refund Policy</Link> for the terms and process.</>,
      },
    ],
  },
];

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can I learn about a product’s materials or provenance?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Details vary by piece. Review the product page for the material, craft, and other information provided for that item. If you need clarification, please contact us before ordering.",
        },
      },
      {
        "@type": "Question",
        name: "Do sarees include a matching blouse piece?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Please check the size and fit information on the individual product page. Inclusions can vary by piece.",
        },
      },
      {
        "@type": "Question",
        name: "Can I request customized tailoring?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Customization availability depends on the piece. Contact us with the product name and your question, and we can advise based on the information available.",
        },
      },
      {
        "@type": "Question",
        name: "How should I care for my purchase?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Care guidance is product-specific. Use the care instructions on that product’s page, and contact us if you need clarification.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods are available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cash on Delivery is available. Other payment options are shown at checkout when the payment gateway is configured.",
        },
      },
      {
        "@type": "Question",
        name: "How long does delivery take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Delivery options and charges are displayed at checkout. Availability and timing depend on the destination. Please see the Shipping & Delivery Policy for details.",
        },
      },
      {
        "@type": "Question",
        name: "How do I request an exchange or refund?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Please review the current Return, Exchange & Refund Policy for the terms and process.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-ivory-100 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.24em] text-gold-800 sm:text-xs">A little guidance</p>
        <div className="grid items-end gap-5 md:grid-cols-12 md:gap-10">
          <h1 className="max-w-[12ch] font-serif text-5xl font-normal leading-[.98] text-charcoal-900 sm:text-6xl md:col-span-7 lg:text-7xl">Frequently asked questions</h1>
          <p className="max-w-lg text-sm leading-7 text-charcoal-600 md:col-span-5 md:justify-self-end sm:text-base">
            Find product-specific information and links to our current store policies.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        {groups.map((group, groupIndex) => (
          <section key={group.title} aria-labelledby={`faq-group-${groupIndex}`} className="grid gap-5 border-t border-ivory-300 pt-5 md:grid-cols-12 md:gap-10">
            <h2 id={`faq-group-${groupIndex}`} className="font-serif text-2xl font-medium text-charcoal-900 md:col-span-4 sm:text-3xl">{group.title}</h2>
            <div className="md:col-span-8">
              {group.questions.map((faq) => (
                <details key={faq.q} className="group border-b border-ivory-300 first:border-t">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left marker:hidden focus-visible:outline-offset-[-2px] [&::-webkit-details-marker]:hidden">
                    <span className="font-serif text-lg font-medium leading-snug text-charcoal-900 sm:text-xl">{faq.q}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-gold-800 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="max-w-2xl pb-5 pr-8 text-sm leading-7 text-charcoal-600">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
