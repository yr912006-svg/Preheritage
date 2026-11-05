import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Shopping Bag | PREHERITAGE",
  description: "Review your selected handcrafted Indian heritage pieces.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

