import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Order Confirmed | PREHERITAGE",
  description: "Your luxury order confirmation details.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
