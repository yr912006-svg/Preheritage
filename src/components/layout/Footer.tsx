"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, ShieldCheck, Mail, ArrowRight, Sparkles, Heart } from "lucide-react";
import Logo from "./Logo";
import { CATEGORIES, REGIONS } from "@/lib/sample-data";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/payments/config", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((config) => {
      if (active) setRazorpayEnabled(config?.razorpayEnabled === true);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setSubscribed(true);
      setEmail("");
    } catch (error) {
      setSubscribeError(error instanceof Error ? error.message : "Subscription could not be saved. Please try again.");
    }
  };

  return (
    <footer className="bg-charcoal-950 text-ivory-200 border-t border-charcoal-900 pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Philosophy & Newsletter Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-16 border-b border-charcoal-800">
          <div className="lg:col-span-6 space-y-4">
            <Logo variant="light" />
            <p className="font-serif italic text-lg sm:text-xl text-ivory-100 max-w-lg mt-3">
              &ldquo;Don’t Just Wear Heritage. Carry It Forward.&rdquo;
            </p>
            <p className="text-xs text-ivory-400 max-w-md leading-relaxed font-light">
              PREHERITAGE is dedicated to the revival of India&apos;s ancient looms, GI-certified handcrafts, and royal textile lineages. Indian Soul. Global Luxury. Timeless Elegance.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://wa.me/919876543210?text=Hello%20Preheritage%20Concierge,%20I%20need%20assistance%20with%20an%20order"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Private Concierge</span>
              </a>
              <Link
                href="/admin"
                className="text-[11px] text-charcoal-300 hover:text-gold-400 transition-colors"
              >
                Admin Portal
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-charcoal-900/60 p-6 sm:p-8 rounded border border-charcoal-800">
              <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-widest mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Preheritage Chronicle</span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-2">
                Join our intimate circle of heritage patrons
              </h3>
              <p className="text-xs text-ivory-300 mb-4 font-light">
                Receive private previews of limited-edition loom launches, cultural artisan narratives, and welcome privileges.
              </p>

              {subscribed ? (
                <div className="p-3 bg-gold-950/60 border border-gold-700/60 rounded text-gold-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold-400" />
                  <span>Welcome to PREHERITAGE. Use code <strong>FIRSTWEAR</strong> on your first order.</span>
                </div>
              ) : (
                <>
                {subscribeError && <p role="alert" className="mb-2 text-xs text-rose-300">{subscribeError}</p>}
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-200" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-charcoal-950 text-white border border-charcoal-700 rounded text-xs focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gold-500 hover:bg-gold-600 text-charcoal-950 text-xs uppercase tracking-widest font-semibold rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Subscribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-12 border-b border-charcoal-800 text-xs">
          {/* Col 1: Handcrafted Categories */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-wider text-gold-400 font-semibold mb-4">
              Collections
            </h4>
            <ul className="space-y-2.5 text-ivory-400">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/shop?category=${cat.slug}`} className="hover:text-gold-300 transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: Heritage Weaving Regions */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-wider text-gold-400 font-semibold mb-4">
              Regional Looms
            </h4>
            <ul className="space-y-2.5 text-ivory-400">
              {REGIONS.map((r) => (
                <li key={r.id}>
                  <Link href={`/shop?region=${r.slug}`} className="hover:text-gold-300 transition-colors">
                    {r.name} ({r.craft.split("&")[0]})
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-wider text-gold-400 font-semibold mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-ivory-400">
              <li>
                <Link href="/track-order" className="hover:text-gold-300 transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-gold-300 transition-colors">
                  Order History & Returns
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-gold-300 transition-colors">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-gold-300 transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-gold-300 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold-300 transition-colors">
                  Contact Concierge
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Preheritage House */}
          <div>
            <h4 className="font-serif text-sm uppercase tracking-wider text-gold-400 font-semibold mb-4">
              The House
            </h4>
            <ul className="space-y-2.5 text-ivory-400">
              <li>
                <Link href="/about" className="hover:text-gold-300 transition-colors">
                  About Preheritage
                </Link>
              </li>
              <li>
                <Link href="/journal" className="hover:text-gold-300 transition-colors">
                  Stories of India (Journal)
                </Link>
              </li>
              <li>
                <Link href="/shop?badge=LIMITED_EDITION" className="hover:text-gold-300 transition-colors">
                  Master Artisan Archives
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gold-300 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-gold-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Brand Trust & Official Identity */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-serif text-sm uppercase tracking-wider text-gold-400 font-semibold mb-4">
              Official Verification
            </h4>
            <p className="text-[11px] text-ivory-400 leading-relaxed mb-3">
              Official Registered Domain: <strong>preheritage.com</strong>.
              Every creation is certified for genuine GI craft lineage.
            </p>
            <div className="p-3 bg-charcoal-900 border border-charcoal-800 rounded space-y-2 text-[10px]">
              <div className="flex items-center gap-1.5 text-gold-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold">{razorpayEnabled ? "Razorpay Secure Payments Available" : "Cash on Delivery Available"}</span>
              </div>
              <div className="text-ivory-400">
                Delivery updates are shared after dispatch.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Payments & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-ivory-400">
          <div>
            © {new Date().getFullYear()} PREHERITAGE. All Rights Reserved. Woven with{" "}
            <Heart className="w-3 h-3 inline text-rose-500 fill-rose-500" /> for Indian Heritage.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="w-full text-center text-[10px] uppercase tracking-wider text-charcoal-300 sm:w-auto sm:text-left sm:mr-2">Payment options:</span>
            {[...(razorpayEnabled ? ["Razorpay"] : []), "Cash on Delivery"].map((method) => (
              <span
                key={method}
                className="px-2 py-0.5 bg-charcoal-900 border border-charcoal-800 rounded text-[10px] text-ivory-300 font-mono"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
