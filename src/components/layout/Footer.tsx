"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { CATEGORIES } from "@/lib/sample-data";
import { WhatsAppContactLink } from "@/components/contact/WhatsAppContactLink";

const linkClass = "inline-flex min-h-[38px] items-center text-[#D0C3AE] transition-colors hover:text-[#B08A45] focus-visible:text-[#B08A45] text-xs";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribedMessage, setSubscribedMessage] = useState("");
  const [subscribeError, setSubscribeError] = useState("");

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setSubscribeError("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || "Subscription could not be saved. Please try again.");
      setSubscribedMessage(result.message || "You are subscribed to the PREHERITAGE newsletter.");
      setEmail("");
    } catch (error) {
      setSubscribeError(error instanceof Error ? error.message : "Subscription could not be saved. Please try again.");
    }
  };

  return (
    <footer className="border-t border-[#B08A45]/20 bg-[#24201D] text-[#F8F2E7]">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8">
        {/* Top Split: Brand Narrative & Newsletter */}
        <div className="grid gap-10 border-b border-[#F8F2E7]/15 pb-12 lg:grid-cols-12 lg:gap-16 lg:pb-16 items-start">
          {/* Brand Column */}
          <div className="lg:col-span-5 text-left">
            <div className="inline-block">
              <Logo variant="light" />
            </div>
            <p className="mt-5 max-w-md font-serif text-xl italic leading-relaxed text-[#F8F2E7] sm:text-2xl">
              Indian soul. Global luxury. Timeless identity.
            </p>
            <p className="mt-2.5 max-w-md font-serif text-sm italic text-[#B08A45]">
              Don&apos;t Just Wear Heritage. Carry It Forward.
            </p>
            <p className="mt-2 max-w-md text-xs sm:text-sm leading-6 text-[#D0C3AE] font-light">
              Master-crafted Varanasi Katan silks, Changthangi Pashmina, and GI-certified single-loom heirlooms direct from Indian master weavers.
            </p>
            <div className="mt-6">
              <WhatsAppContactLink
                className="inline-flex min-h-[42px] items-center gap-2.5 border-b border-[#B08A45]/40 text-xs font-semibold uppercase tracking-[0.16em] text-[#D0C3AE] transition-colors hover:border-[#B08A45] hover:text-[#B08A45]"
                message="Hello PREHERITAGE Concierge, I need assistance with an order"
                fallbackHref="/contact"
              >
                <MessageCircle className="h-4 w-4 text-[#B08A45]" aria-hidden="true" />
                <span>Contact PREHERITAGE Concierge</span>
              </WhatsAppContactLink>
            </div>
          </div>

          {/* Newsletter Section */}
          <section aria-labelledby="newsletter-heading" className="border-t border-[#F8F2E7]/15 pt-8 lg:col-span-7 lg:border-0 lg:pt-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px w-5 bg-[#B08A45]" aria-hidden="true" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#B08A45]">The Gazette</p>
            </div>
            <h2 id="newsletter-heading" className="font-serif text-2xl sm:text-3xl font-normal text-[#F8F2E7]">
              Notes from PREHERITAGE
            </h2>
            <p className="mt-2 max-w-lg text-xs sm:text-sm leading-6 text-[#D0C3AE] font-light">
              Sign up to receive private invitations to limited salon drops, master weaver memoirs, and seasonal textile showcases.
            </p>
            {subscribedMessage ? (
              <p role="status" className="mt-5 border-l-2 border-[#B08A45] py-2 pl-3 text-sm text-[#F8F2E7] bg-[#FAF8F5]/5">
                {subscribedMessage}
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Email address</span>
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D0C3AE]" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                    className="min-h-[48px] w-full border border-[#F8F2E7]/25 bg-transparent pl-11 pr-4 text-sm text-[#F8F2E7] placeholder:text-[#D0C3AE]/60 focus:border-[#B08A45] focus:outline-none transition-colors rounded-xs"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2.5 bg-[#F8F2E7] px-7 text-xs font-semibold uppercase tracking-[0.18em] text-[#24201D] transition-colors hover:bg-[#B08A45] hover:text-[#FAF8F5] rounded-xs shadow-luxury"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            )}
            {subscribeError && <p role="alert" className="mt-3 text-xs text-rose-300">{subscribeError}</p>}
          </section>
        </div>

        {/* Footer Navigation Columns */}
        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-6 gap-y-10 border-b border-[#F8F2E7]/15 py-10 text-xs sm:gap-x-8 md:grid-cols-4 md:py-12">
          <div>
            <h3 className="mb-3 font-serif text-lg font-medium text-[#F8F2E7] tracking-wide">Collections</h3>
            <ul className="space-y-0.5">
              <li><Link href="/shop" className={linkClass}>All pieces</Link></li>
              {CATEGORIES.map((category) => (
                <li key={category.id}>
                  <Link
                    href={category.slug === "mens-ethnic-wear" ? "/collections/mens-ethnic-wear" : `/shop?category=${category.slug}`}
                    className={linkClass}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-lg font-medium text-[#F8F2E7] tracking-wide">The House</h3>
            <ul className="space-y-0.5">
              <li><Link href="/about" className={linkClass}>Our story &amp; memoir</Link></li>
              <li><Link href="/journal" className={linkClass}>Art &amp; Heritage Journal</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact Concierge</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-lg font-medium text-[#F8F2E7] tracking-wide">Customer Care</h3>
            <ul className="space-y-0.5">
              <li><Link href="/track-order" className={linkClass}>Track an order</Link></li>
              <li><Link href="/account/orders" className={linkClass}>Order history</Link></li>
              <li><Link href="/faq" className={linkClass}>Frequently asked questions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-serif text-lg font-medium text-[#F8F2E7] tracking-wide">Policies</h3>
            <ul className="space-y-0.5">
              <li><Link href="/shipping-policy" className={linkClass}>Shipping &amp; delivery</Link></li>
              <li><Link href="/return-policy" className={linkClass}>Returns &amp; exchanges</Link></li>
              <li><Link href="/terms" className={linkClass}>Terms &amp; conditions</Link></li>
              <li><Link href="/privacy-policy" className={linkClass}>Privacy policy</Link></li>
            </ul>
          </div>
        </nav>

        {/* Bottom Colophon */}
        <div className="flex flex-col gap-3 pt-6 text-[11px] text-[#D0C3AE] sm:flex-row sm:items-center sm:justify-between font-light">
          <p>© {new Date().getFullYear()} PREHERITAGE. All rights reserved.</p>
          <p className="font-serif italic text-xs text-[#B08A45]">Wear the Stories of India.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
