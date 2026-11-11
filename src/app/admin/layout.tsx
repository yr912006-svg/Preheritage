import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "PREHERITAGE Administration",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
