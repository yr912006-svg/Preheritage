import React from "react";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import Logo from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="bg-ivory-100 min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-ivory-50 p-8 sm:p-12 text-center rounded border border-ivory-300 shadow-luxury">
        <Logo />
        <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center mx-auto mt-6 mb-4">
          <Compass className="w-8 h-8 text-gold-600 animate-spin" style={{ animationDuration: "12s" }} />
        </div>
        <span className="text-[11px] uppercase tracking-widest text-gold-700 font-bold block mb-1">
          404 • Path Uncharted
        </span>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-xs text-charcoal-100 mb-8 font-light leading-relaxed">
          The heritage corridor or collection you are seeking may have moved or is reserved for our private patrons.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold rounded transition-colors shadow-sm"
        >
          <span>Return to Grand Atelier</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
