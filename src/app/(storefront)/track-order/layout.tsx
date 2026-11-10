import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Track Your Order | PREHERITAGE",
  description: "Track your PREHERITAGE handcrafted order status.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
