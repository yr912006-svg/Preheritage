import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Forgot Password | PREHERITAGE",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

