"use client";

import React, { useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import type { ProductItem } from "@/lib/sample-data";

export const BestSellers: React.FC<{
  products: ProductItem[];
  isDatabaseConnected?: boolean;
}> = ({ products }) => {
  const [filter, setFilter] = useState<"ALL" | "BESTSELLER" | "NEW">("ALL");

  const filteredProducts = products.filter((p) => {
    if (filter === "BESTSELLER") return p.isBestSeller;
    if (filter === "NEW") return p.isNewArrival;
    return true;
  });

  return (
    <section className="py-16 sm:py-24 lg:py-28 bg-[#FAF8F5] text-charcoal relative border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Eyebrow and Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-5 pb-5 sm:pb-6 border-b border-stone-200/80">
          <div className="text-left">
            <span className="text-[11px] uppercase tracking-[0.28em] text-[#B08A45] font-semibold font-sans block mb-2">
              PATRON FAVORITES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal text-[#24201D] leading-tight tracking-tight">
              Timeless Elegance
            </h2>
          </div>

          {/* Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter products"
            className="inline-flex items-center gap-1 sm:gap-1.5 p-1 border border-stone-200/90 bg-white/70 self-start md:self-auto max-w-full"
          >
            <button
              role="tab"
              aria-selected={filter === "ALL"}
              onClick={() => setFilter("ALL")}
              className={`min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 text-[10.5px] sm:text-[11px] font-medium tracking-[0.18em] uppercase transition-colors ${
                filter === "ALL"
                  ? "bg-[#24201D] text-[#FAF8F5] font-semibold"
                  : "text-stone-600 hover:text-[#24201D]"
              }`}
            >
              CURATED ALL
            </button>
            <button
              role="tab"
              aria-selected={filter === "BESTSELLER"}
              onClick={() => setFilter("BESTSELLER")}
              className={`min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 text-[10.5px] sm:text-[11px] font-medium tracking-[0.18em] uppercase transition-colors ${
                filter === "BESTSELLER"
                  ? "bg-[#24201D] text-[#FAF8F5] font-semibold"
                  : "text-stone-600 hover:text-[#24201D]"
              }`}
            >
              BESTSELLERS
            </button>
            <button
              role="tab"
              aria-selected={filter === "NEW"}
              onClick={() => setFilter("NEW")}
              className={`min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 text-[10.5px] sm:text-[11px] font-medium tracking-[0.18em] uppercase transition-colors ${
                filter === "NEW"
                  ? "bg-[#24201D] text-[#FAF8F5] font-semibold"
                  : "text-stone-600 hover:text-[#24201D]"
              }`}
            >
              NEW ARRIVALS
            </button>
          </div>
        </div>

        {/* Product Collection Showcase */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-7 items-start">
            {filteredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} compact />
            ))}
          </div>
        ) : (
          <div className="py-16 px-6 text-center border border-stone-200/80 bg-white/40 max-w-xl mx-auto">
            <p className="font-serif text-xl text-[#24201D] font-light mb-2">New additions arriving soon</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              Our master weavers in Varanasi and Kashmir are crafting new pieces for this collection.
            </p>
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className="mt-4 text-[11px] uppercase tracking-[0.2em] text-[#B08A45] hover:text-[#24201D] font-semibold underline underline-offset-4"
            >
              View all curated pieces
            </button>
          </div>
        )}

        {/* View Complete Catalogue CTA */}
        <div className="mt-14 sm:mt-16 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#24201D] bg-transparent text-[#24201D] text-xs font-medium tracking-[0.22em] uppercase hover:bg-[#24201D] hover:text-[#FAF8F5] transition-all duration-300 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#B08A45]"
          >
            <span>VIEW COMPLETE CATALOGUE</span>
            <span className="text-sm">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
