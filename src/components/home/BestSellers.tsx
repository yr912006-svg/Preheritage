"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";

export const BestSellers: React.FC = () => {
  const [filter, setFilter] = useState<"ALL" | "BESTSELLER" | "NEW">("ALL");

  const filteredProducts = SAMPLE_PRODUCTS.filter((p) => {
    if (filter === "BESTSELLER") return p.isBestSeller;
    if (filter === "NEW") return p.isNewArrival;
    return true;
  });

  return (
    <section className="py-20 sm:py-28 bg-ivory-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
          <div>
            <span className="text-xs uppercase tracking-[0.24em] text-gold-600 font-semibold font-sans block mb-2">
              Patron Favorites
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900">
              Timeless Elegance
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="mt-6 md:mt-0 flex items-center gap-2 bg-ivory-200/60 p-1 rounded-full border border-ivory-300">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-full transition-all ${
                filter === "ALL"
                  ? "bg-charcoal-900 text-ivory-50 shadow-sm"
                  : "text-charcoal-200 hover:text-charcoal-900"
              }`}
            >
              Curated All
            </button>
            <button
              onClick={() => setFilter("BESTSELLER")}
              className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-full transition-all ${
                filter === "BESTSELLER"
                  ? "bg-charcoal-900 text-ivory-50 shadow-sm"
                  : "text-charcoal-200 hover:text-charcoal-900"
              }`}
            >
              Bestsellers
            </button>
            <button
              onClick={() => setFilter("NEW")}
              className={`px-4 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-full transition-all ${
                filter === "NEW"
                  ? "bg-charcoal-900 text-ivory-50 shadow-sm"
                  : "text-charcoal-200 hover:text-charcoal-900"
              }`}
            >
              New Arrivals
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-ivory-100 hover:bg-gold-500 text-charcoal-900 border border-ivory-300 hover:border-gold-500 text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-sm hover:shadow-gold rounded-xs"
          >
            <span>View Complete Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
