"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import type { StorefrontRegion } from "@/lib/catalog";
import { REGIONS } from "@/lib/sample-data";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const ShopByRegion: React.FC<{ regions: StorefrontRegion[] }> = ({ regions }) => {
  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-[#F8F2E7] border-y border-[#E8DFC8] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal direction="up" delayMs={50}>
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-px w-6 bg-[#B08A45]" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#B08A45] font-semibold font-sans">
                THE LIVING GEOGRAPHY OF INDIAN CRAFT
              </span>
              <span className="h-px w-6 bg-[#B08A45]" aria-hidden="true" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#24201D] mb-4 leading-tight">
              Shop by Cultural Region
            </h2>
            <p className="text-sm sm:text-base text-[#24201D]/80 font-light leading-relaxed max-w-2xl mx-auto">
              Every corner of India breathes its own dialect of handcraft. Travel across sacred riverbanks, Himalayan altitudes, and royal desert courtyards through authentic weaves.
            </p>
          </div>
        </ScrollReveal>

        {/* Regions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {regions.map((region, index) => {
            const approvedRegionImage = REGIONS.find((r) => r.slug === region.slug)?.image;
            const isLegacyRegionImage = region.bannerImage?.includes("images.unsplash.com");
            const regionImage = isLegacyRegionImage
              ? (approvedRegionImage || region.bannerImage)
              : (region.bannerImage || approvedRegionImage || "/images/regions/region-varanasi.jpg");

            return (
              <ScrollReveal
                key={region.id}
                direction="up"
                delayMs={(index % 3) * 90}
                durationMs={700}
              >
                <Link
                  href={`/shop?region=${region.slug}`}
                  className="group block bg-[#FAF8F5] rounded-xs overflow-hidden border border-[#E8DFC8] hover:border-[#B08A45] transition-all duration-500 shadow-luxury hover:shadow-luxury-xl luxury-card-lift flex flex-col justify-between h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                  aria-label={`Explore ${region.name} heritage craftsmanship`}
                >
                  <div>
                    {/* Region Image Frame */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FAF6EF]">
                      <Image
                        src={regionImage}
                        alt={`${region.name} — ${region.craftForm} heritage craftsmanship`}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#24201D]/40 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-3 left-3 bg-[#24201D]/85 backdrop-blur-xs px-2.5 py-1 text-[10px] uppercase tracking-widest text-[#C5A869] font-medium flex items-center gap-1.5 shadow-xs border border-[#B08A45]/20">
                        <MapPin className="w-3 h-3 text-[#B08A45]" />
                        <span>{region.state}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#B08A45] font-bold mb-1.5">
                        {region.craftForm}
                      </div>
                      <h3 className="font-serif text-2xl font-normal text-[#24201D] group-hover:text-[#B08A45] transition-colors mb-2.5">
                        {region.name}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#24201D]/75 font-light leading-relaxed line-clamp-3">
                        {region.culturalStory}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Strip */}
                  <div className="p-6 pt-0">
                    <div className="w-full py-2.5 border-t border-[#E8DFC8] group-hover:border-[#B08A45]/50 text-[#24201D] group-hover:text-[#B08A45] text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-between transition-colors">
                      <span>Explore {region.name} Looms</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 text-[#B08A45]" />
                    </div>
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

export default ShopByRegion;
