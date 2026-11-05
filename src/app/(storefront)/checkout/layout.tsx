import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Secure Checkout | PREHERITAGE",
  description: "Complete your luxury Indian heritage order securely.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

