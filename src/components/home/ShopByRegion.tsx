import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight } from "lucide-react";
import type { StorefrontRegion } from "@/lib/catalog";
import { REGIONS } from "@/lib/sample-data";
import ScrollReveal from "@/components/ui/ScrollReveal";

export const ShopByRegion: React.FC<{ regions: StorefrontRegion[] }> = ({ regions }) => {
  return (
    <section className="py-20 sm:py-28 bg-ivory-100 border-y border-ivory-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal direction="up" delayMs={50}>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[0.26em] text-gold-600 font-semibold font-sans block mb-2">
              The Living Geography of Indian Craft
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal-900 mb-4 leading-tight">
              Shop by Cultural Region
            </h2>
            <p className="text-sm sm:text-base text-charcoal-50 font-light leading-relaxed">
              Every corner of India breathes its own dialect of handcraft. Travel across sacred riverbanks, Himalayan altitudes, and royal desert courtyards through authentic weaves.
            </p>
          </div>
        </ScrollReveal>

        {/* Regions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {regions.map((region, index) => {
            const approvedRegionImage = REGIONS.find((r) => r.slug === region.slug)?.image;
            const isLegacyRegionImage = region.bannerImage?.includes("images.unsplash.com");
            const regionImage = isLegacyRegionImage ? (approvedRegionImage || region.bannerImage) : (region.bannerImage || approvedRegionImage);

            return (
              <ScrollReveal
                key={region.id}
                direction="up"
                delayMs={(index % 3) * 100}
                durationMs={700}
              >
                <Link
                  href={`/shop?region=${region.slug}`}
                  className="group block bg-white rounded-xs overflow-hidden border border-ivory-300 hover:border-gold-400 transition-all duration-300 hover:shadow-luxury-lg luxury-card-lift flex flex-col justify-between h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  aria-label={`Explore ${region.name} heritage craftsmanship`}
                >
                  <div>
                    {/* Region Image Frame */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-ivory-200">
                      {regionImage ? (
                        <Image
                          src={regionImage}
                          alt={`${region.name} — ${region.craftForm} heritage craftsmanship`}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gold-100 to-charcoal-300" />
                      )}
                      <div className="absolute top-3 left-3 bg-charcoal-900/85 backdrop-blur-xs px-2.5 py-1 text-[10px] uppercase tracking-widest text-gold-300 font-medium flex items-center gap-1.5 shadow-xs">
                        <MapPin className="w-3 h-3 text-gold-400" />
                        <span>{region.state}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="text-[10.5px] uppercase tracking-[0.24em] text-gold-600 font-semibold mb-1.5">
                        {region.craftForm}
                      </div>
                      <h3 className="font-serif text-2xl font-normal text-charcoal-900 group-hover:text-gold-700 transition-colors mb-2.5">
                        {region.name}
                      </h3>
                      <p className="text-xs text-charcoal-50 font-light leading-relaxed line-clamp-3">
                        {region.culturalStory}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action */}
                  <div className="p-6 pt-0">
                    <div className="w-full py-2.5 border-t border-ivory-200 group-hover:border-gold-300 text-charcoal-900 group-hover:text-gold-700 text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-between transition-colors">
                      <span>Explore {region.name} Looms</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
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
