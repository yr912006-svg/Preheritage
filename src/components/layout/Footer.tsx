"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import Logo from "./Logo";
import { CATEGORIES } from "@/lib/sample-data";
import { WhatsAppContactLink } from "@/components/contact/WhatsAppContactLink";

const linkClass = "inline-flex min-h-9 items-center text-[#D0C3AE] transition-colors hover:text-[#B08A45] focus-visible:text-[#B08A45]";

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
    <footer className="border-t border-[rgba(248,242,231,0.18)] bg-[#24201D] text-[#F8F2E7]">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8">
        <div className="grid gap-10 border-b border-[rgba(248,242,231,0.18)] pb-10 lg:grid-cols-12 lg:gap-14 lg:pb-14">
          <div className="lg:col-span-5">
            <Logo variant="light" />
            <p className="mt-5 max-w-md font-serif text-xl italic leading-relaxed text-[#F8F2E7] sm:text-2xl">
              Indian soul. Global luxury. Timeless identity.
            </p>
            <p className="mt-2.5 max-w-md font-serif text-sm italic text-[#B08A45]">
              Don&apos;t Just Wear Heritage. Carry It Forward.
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#D0C3AE]">
              PREHERITAGE — Wear the Stories of India.
            </p>
            <WhatsAppContactLink
              className="mt-5 inline-flex min-h-11 items-center gap-2 border-b border-[rgba(248,242,231,0.18)] text-xs font-medium uppercase tracking-[0.14em] text-[#D0C3AE] transition-colors hover:border-[#B08A45] hover:text-[#B08A45]"
              message="Hello PREHERITAGE Concierge, I need assistance with an order"
              fallbackHref="/contact"
            >
              <MessageCircle className="h-4 w-4 text-[#B08A45]" aria-hidden="true" />
              Contact PREHERITAGE Concierge
            </WhatsAppContactLink>
          </div>

          <section aria-labelledby="newsletter-heading" className="border-t border-[rgba(248,242,231,0.18)] pt-7 lg:col-span-7 lg:border-0 lg:pt-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#B08A45]">The Gazette</p>
            <h2 id="newsletter-heading" className="mt-2 max-w-lg font-serif text-2xl font-normal text-[#F8F2E7] sm:text-3xl">Notes from PREHERITAGE</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#D0C3AE]">Sign up to receive invitations to private salon drops and artisan memoirs.</p>
            {subscribedMessage ? (
              <p role="status" className="mt-5 border-l-2 border-[#B08A45] py-2 pl-3 text-sm text-[#F8F2E7]">{subscribedMessage}</p>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-5 flex max-w-xl flex-col gap-3 sm:flex-row">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Email address</span>
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D0C3AE]" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email address"
                    autoComplete="email"
                    required
                    className="min-h-12 w-full border border-[rgba(248,242,231,0.18)] bg-transparent pl-10 pr-3 text-sm text-[#F8F2E7] placeholder:text-[#D0C3AE]/70 focus:border-[#B08A45] focus:outline-none transition-colors"
                  />
                </label>
                <button
                  type="submit"
                  className="cta-shimmer-btn inline-flex min-h-12 items-center justify-center gap-3 bg-[#F8F2E7] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#24201D] transition-colors hover:bg-[#B08A45] hover:text-[#FAF8F5]"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            )}
            {subscribeError && <p role="alert" className="mt-3 text-sm text-rose-300">{subscribeError}</p>}
          </section>
        </div>

        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-5 gap-y-9 border-b border-[rgba(248,242,231,0.18)] py-9 text-xs sm:gap-x-8 md:grid-cols-4 md:py-11">
          <div>
            <h2 className="mb-3 font-serif text-lg font-medium text-[#F8F2E7]">Shop</h2>
            <ul className="space-y-1">
              <li><Link href="/shop" className={linkClass}>All pieces</Link></li>
              {CATEGORIES.map((category) => <li key={category.id}><Link href={`/shop?category=${category.slug}`} className={linkClass}>{category.name}</Link></li>)}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-lg font-medium text-[#F8F2E7]">The house</h2>
            <ul className="space-y-1">
              <li><Link href="/about" className={linkClass}>Our story</Link></li>
              <li><Link href="/journal" className={linkClass}>Art &amp; Heritage</Link></li>
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-lg font-medium text-[#F8F2E7]">Customer care</h2>
            <ul className="space-y-1">
              <li><Link href="/track-order" className={linkClass}>Track an order</Link></li>
              <li><Link href="/account/orders" className={linkClass}>Order history</Link></li>
              <li><Link href="/faq" className={linkClass}>Frequently asked questions</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 font-serif text-lg font-medium text-[#F8F2E7]">Policies</h2>
            <ul className="space-y-1">
              <li><Link href="/shipping-policy" className={linkClass}>Shipping &amp; delivery</Link></li>
              <li><Link href="/return-policy" className={linkClass}>Returns &amp; exchanges</Link></li>
              <li><Link href="/terms" className={linkClass}>Terms &amp; conditions</Link></li>
              <li><Link href="/privacy-policy" className={linkClass}>Privacy policy</Link></li>
            </ul>
          </div>
        </nav>

        <div className="flex flex-col gap-3 pt-6 text-[11px] text-[#D0C3AE] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PREHERITAGE. All rights reserved.</p>
          <p>Wear the Stories of India.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
