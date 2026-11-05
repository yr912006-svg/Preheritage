"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { StorefrontCategory } from "@/lib/catalog";
import { getStorefrontCategoryCountLabel, getStorefrontCategoryImage } from "@/lib/category-presentation";
import { CATEGORIES } from "@/lib/sample-data";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const ShopByCategory: React.FC<{
  categories: StorefrontCategory[];
  productCounts: Record<string, number> | null;
}> = ({ categories, productCounts }) => {
  return (
    <section className="py-20 sm:py-28 bg-white border-b border-ivory-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up" delayMs={50}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16">
            <div>
              <span className="text-xs uppercase tracking-[0.26em] text-gold-600 font-semibold font-sans block mb-2">
                Curated Masterpieces
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal-900 leading-tight">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/shop"
              className="editorial-nav-link mt-4 md:mt-0 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-charcoal-900 hover:text-gold-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
            >
              <span>View All Collections</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => {
            const approvedCategoryImage = CATEGORIES.find((c) => c.slug === category.slug)?.image;
            const image = category.image?.trim() || approvedCategoryImage || null;
            const destinationHref =
              category.slug === "mens-ethnic-wear" ? "/collections/mens-ethnic-wear" : `/shop?category=${category.slug}`;
            const fallbackLabel = category.slug === "mens-ethnic-wear" ? "EXPLORE THE COLLECTION" : "Curated Collection";
            const imageAlt =
              category.imageAlt?.trim() ||
              (category.slug === "mens-ethnic-wear"
                ? "Indian male model in tailored ivory raw silk kurta and muted maroon Nehru jacket"
                : `${category.name} collection - PREHERITAGE`);

            const focalPoint = category.focalPoint?.trim() || "center";
            const getObjectPosition = (fp: string) => {
              switch (fp.toLowerCase()) {
                case "top":
                  return "center top";
                case "bottom":
                  return "center bottom";
                case "left":
                  return "left center";
                case "right":
                  return "right center";
                case "center":
                  return "center center";
                default:
                  return fp;
              }
            };

            return (
              <ScrollReveal
                key={category.id}
                direction="up"
                delayMs={(index % 4) * 90}
                durationMs={700}
              >
                <Link
                  href={destinationHref}
                  className="group relative block aspect-[3/4] overflow-hidden rounded-sm bg-ivory-200 border border-ivory-300 hover:border-gold-400 luxury-card-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                  aria-label={`Explore ${category.name} collection`}
                >
                  {image ? (
                    <Image
                      src={image}
                      alt={imageAlt}
                      fill
                      unoptimized={image.startsWith("/api/storage/")}
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-108 motion-reduce:transform-none motion-reduce:transition-none"
                      style={{ objectPosition: getObjectPosition(focalPoint) }}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-gold-100 to-charcoal-200 font-serif text-3xl text-charcoal-700">
                      PH
                    </div>
                  )}

                  {/* Gradient Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/20 to-transparent transition-opacity duration-300 group-hover:from-charcoal-950/90" />

                  {/* Text Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-ivory-50 flex flex-col justify-end">
                    <span className="text-[10px] uppercase tracking-widest text-gold-300 font-medium mb-1">
                      {getStorefrontCategoryCountLabel(productCounts, category.slug, fallbackLabel)}
                    </span>
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-white group-hover:text-gold-300 transition-colors">
                        {category.name}
                      </h3>
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-[11px] text-ivory-300 font-light mt-1 line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {category.description}
                    </p>
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
