"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { StorefrontCategory } from "@/lib/catalog";
import { getStorefrontCategoryCountLabel } from "@/lib/category-presentation";
import { CATEGORIES } from "@/lib/sample-data";
import ScrollReveal from "@/components/ui/ScrollReveal";

// Canonical category metadata mapping to guarantee 100% authentic images and destinations
const CANONICAL_CATEGORY_DATA: Record<string, { image: string; href: string; name: string; desc: string }> = {
  sarees: {
    name: "Sarees",
    href: "/shop?category=sarees",
    image: "/images/categories/category-sarees.jpg",
    desc: "Six yards of unstitched poetry woven across sacred looms.",
  },
  kurtas: {
    name: "Kurtas & Tunics",
    href: "/shop?category=kurtas",
    image: "/images/categories/category-kurtas.jpg",
    desc: "Breathable silks and handspun khadi tailored for modern poise.",
  },
  lehengas: {
    name: "Lehengas",
    href: "/shop?category=lehengas",
    image: "/images/categories/category-lehengas.jpg",
    desc: "Regal silhouettes adorned with zardozi and gota patti.",
  },
  "mens-ethnic-wear": {
    name: "Men’s Ethnic Wear",
    href: "/collections/mens-ethnic-wear",
    image: "/images/categories/category-mens-ethnic-wear.jpg",
    desc: "Classic kurtas and refined royal Nehru jackets.",
  },
  handloom: {
    name: "Handloom",
    href: "/shop?category=handloom",
    image: "/images/categories/category-handloom.jpg",
    desc: "Pure GI-tagged heritage weaves from master artisan clusters.",
  },
  accessories: {
    name: "Accessories & Shawls",
    href: "/shop?category=accessories",
    image: "/images/categories/category-accessories.jpg",
    desc: "Pure Pashmina wraps and handcrafted antique jewelry.",
  },
  handicrafts: {
    name: "Handicrafts & Decor",
    href: "/shop?category=handicrafts",
    image: "/images/categories/category-handicrafts.jpg",
    desc: "Hand-chiseled brass and wooden heirloom artifacts.",
  },
  posters: {
    name: "Art Posters",
    href: "/shop?category=posters",
    image: "/images/categories/category-posters.jpg",
    desc: "Limited-edition archival prints of timeless architectural marvels.",
  },
};

export const ShopByCategory: React.FC<{
  categories: StorefrontCategory[];
  productCounts: Record<string, number> | null;
}> = ({ categories, productCounts }) => {
  // 1. Strict deduplication by normalized slug to eliminate unintended duplicate cards
  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    const deduped: StorefrontCategory[] = [];

    // Prioritize passed categories
    for (const cat of categories) {
      const normalizedSlug = cat.slug.toLowerCase().trim();
      if (!seen.has(normalizedSlug)) {
        seen.add(normalizedSlug);
        deduped.push(cat);
      }
    }

    // Ensure all 8 canonical categories are represented
    for (const sample of CATEGORIES) {
      const normalizedSlug = sample.slug.toLowerCase().trim();
      if (!seen.has(normalizedSlug)) {
        seen.add(normalizedSlug);
        deduped.push({
          ...sample,
          orderIndex: deduped.length,
        });
      }
    }

    return deduped;
  }, [categories]);

  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-[#FAF8F5] border-b border-[#E8DFC8] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up" delayMs={50}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 pb-5 border-b border-[#E8DFC8]/70">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-px w-6 bg-[#B08A45]" aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.28em] text-[#B08A45] font-semibold font-sans">
                  CURATED MASTERPIECES
                </span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#24201D] leading-tight">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/shop"
              className="group mt-4 md:mt-0 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] font-semibold text-[#24201D] hover:text-[#B08A45] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
            >
              <span className="border-b border-[#24201D] group-hover:border-[#B08A45] pb-0.5 transition-colors">
                View All Collections
              </span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#B08A45]" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Categories Grid — 8 Clean Luxury Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7">
          {uniqueCategories.map((category, index) => {
            const canonical = CANONICAL_CATEGORY_DATA[category.slug.toLowerCase().trim()];
            const title = canonical?.name || category.name;
            const destinationHref = canonical?.href || (category.slug === "mens-ethnic-wear" ? "/collections/mens-ethnic-wear" : `/shop?category=${category.slug}`);
            const image = canonical?.image || category.image?.trim() || "/images/categories/category-sarees.jpg";
            const description = canonical?.desc || category.description;
            const fallbackLabel = category.slug === "mens-ethnic-wear" ? "EXPLORE THE COLLECTION" : "Curated Collection";

            return (
              <ScrollReveal
                key={category.slug}
                direction="up"
                delayMs={(index % 4) * 80}
                durationMs={700}
              >
                <Link
                  href={destinationHref}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-xs bg-[#FAF6EF] border border-[#E8DFC8] hover:border-[#B08A45] transition-all duration-500 shadow-luxury hover:shadow-luxury-xl luxury-card-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                  aria-label={`Explore ${title} collection`}
                >
                  <Image
                    src={image}
                    alt={`${title} collection - PREHERITAGE`}
                    fill
                    unoptimized={image.startsWith("/api/storage/")}
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {/* Gradient Scrim for crystal clear readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24201D]/90 via-[#24201D]/35 to-transparent transition-opacity duration-300 group-hover:from-[#24201D]/95" />

                  {/* Text Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-[#F8F2E7] flex flex-col justify-end">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C5A869] font-semibold mb-1">
                      {getStorefrontCategoryCountLabel(productCounts, category.slug, fallbackLabel)}
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-[#F8F2E7] transition-colors leading-snug">
                        {title}
                      </h3>
                      <div className="w-7 h-7 rounded-full bg-[#FAF8F5]/20 backdrop-blur-xs flex items-center justify-center transform translate-x-1.5 opacity-80 group-hover:translate-x-0 group-hover:opacity-100 group-hover:bg-[#B08A45] transition-all duration-300 shrink-0">
                        <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    {description && (
                      <p className="text-[11px] text-[#D0C3AE] font-light mt-1 line-clamp-1 opacity-85 group-hover:opacity-100 transition-opacity">
                        {description}
                      </p>
                    )}
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
