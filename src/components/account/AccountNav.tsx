"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

const links = [
  { href: "/account", label: "Profile & Addresses" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/wishlist", label: "Saved Heirlooms" },
];

export function AccountNav({ active }: { active: string }) {
  return (
    <nav aria-label="Account" className="flex flex-wrap gap-2 border-b border-ivory-300 pb-4">
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={active === link.href ? "page" : undefined}
          className={`rounded px-4 py-2 text-xs font-semibold transition-colors ${active === link.href ? "bg-charcoal-900 text-ivory-50" : "bg-ivory-50 text-charcoal-700 hover:bg-ivory-200"}`}>
          {link.label}
        </Link>
      ))}
      <button type="button" onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded bg-ivory-50 px-4 py-2 text-xs font-semibold text-charcoal-700 transition-colors hover:bg-ivory-200">
        Sign out
      </button>
    </nav>
  );
}

export function AccountPageFrame({ active, title, children }: { active: string; title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] bg-ivory-100 py-12">
      <div className="mx-auto max-w-6xl space-y-7 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-700">Private Patron Account</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-charcoal-900">{title}</h1>
        </div>
        <AccountNav active={active} />
        {children}
      </div>
    </div>
  );
}
