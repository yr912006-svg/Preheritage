import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Reset Password | PREHERITAGE",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
