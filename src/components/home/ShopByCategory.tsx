import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "@/lib/sample-data";

export const ShopByCategory: React.FC<{ productCounts: Record<string, number> | null }> = ({ productCounts }) => {
  return (
    <section className="py-20 sm:py-28 bg-ivory-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
          <div>
            <span className="text-xs uppercase tracking-[0.24em] text-gold-600 font-semibold font-sans block mb-2">
              Curated Masterpieces
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/shop"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-semibold text-charcoal-800 hover:text-gold-600 transition-colors"
          >
            <span>View All Collections</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-ivory-200 border border-ivory-300"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/20 to-transparent transition-opacity duration-300" />

              {/* Text Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 text-ivory-50 flex flex-col justify-end">
                <span className="text-[10px] uppercase tracking-widest text-gold-300 font-medium mb-1">
                  {productCounts ? `${productCounts[category.slug] ?? 0} Handcrafted Items` : "Catalog count unavailable"}
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-gold-300 transition-colors">
                    {category.name}
                  </h3>
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                    <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <p className="text-[11px] text-ivory-300 font-light mt-1 line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
