"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Globe, ShieldCheck } from "lucide-react";

const announcements = [
  {
    text: "Complimentary Express Delivery on all Indian orders above ₹4,999",
    icon: Sparkles,
  },
  {
    text: "Many Stories. One Thread — Handcrafted GI-Certified Heritage Weaves",
    icon: ShieldCheck,
  },
  {
    text: "Now Shipping Globally to USA, UK, UAE, Canada & 40+ Countries",
    icon: Globe,
  },
];

export const AnnouncementBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = announcements[currentIndex];
  const Icon = current.icon;

  return (
    <div className="bg-charcoal-900 text-ivory-100 py-2 px-4 text-xs font-sans border-b border-charcoal-800 transition-colors duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden md:flex items-center gap-4 text-ivory-300 text-[11px] tracking-wider uppercase">
          <span>Official Store</span>
          <span>•</span>
          <span className="text-gold-400">preheritage.com</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 text-center text-xs tracking-wide">
          <Icon className="w-3.5 h-3.5 text-gold-400 shrink-0 animate-pulse" />
          <span className="font-light text-ivory-100 transition-all duration-300">
            {current.text}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3 text-ivory-300 text-[11px]">
          <Link href="/track-order" className="hover:text-gold-300 transition-colors">
            Track Order
          </Link>
          <span>•</span>
          <Link href="/contact" className="hover:text-gold-300 transition-colors">
            Concierge
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
