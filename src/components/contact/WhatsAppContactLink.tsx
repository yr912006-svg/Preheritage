"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp-contact";

export function WhatsAppContactLink({
  children,
  message,
  className,
  fallbackHref,
  fallbackText,
}: {
  children: ReactNode;
  message?: string;
  className: string;
  fallbackHref: string;
  fallbackText?: string;
}) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/contact/whatsapp", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((config) => {
        const next = buildWhatsAppContactUrl(config?.number, message);
        if (active) setHref(next);
      })
      .catch(() => {
        if (active) setHref(null);
      });
    return () => {
      active = false;
    };
  }, [message]);

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={fallbackHref} className={className}>
      {children}
    </Link>
  );
}
