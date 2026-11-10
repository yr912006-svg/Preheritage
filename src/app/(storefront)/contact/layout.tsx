import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Contact Concierge & Atelier | PREHERITAGE",
  description:
    "Connect with the PREHERITAGE concierge for bespoke Indian heritage fashion consultations, saree tailoring, and trousseau inquiries.",
  openGraph: {
    title: "Contact Concierge & Atelier | PREHERITAGE",
    description:
      "Connect with the PREHERITAGE concierge for bespoke Indian heritage fashion consultations, saree tailoring, and trousseau inquiries.",
    url: "https://preheritage.com/contact",
  },
  alternates: {
    canonical: "https://preheritage.com/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
