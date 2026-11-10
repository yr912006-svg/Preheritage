"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

type HeroBannerRecord = {
  id?: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileUrl?: string | null;
  link: string | null;
  tagline: string | null;
  position?: string | null;
};

const approvedHeroImage = "/images/preheritage-hero.png";

export const HeroBanner: React.FC<{ banner?: HeroBannerRecord | null }> = ({ banner }) => {
  const [failedImageSources, setFailedImageSources] = useState<string[]>([]);

  // Banner content resolution directly from database/admin record or fallback
  const title = banner?.title?.trim() || "Many Stories. One Thread.";
  const subtitle = banner?.subtitle?.trim() || "Discover India's living textile heritage, woven by master artisans.";
  const ctaText = banner?.tagline?.trim() || "Explore the Collection";
  const ctaLink = banner?.link?.trim() || "/shop";

  // Use the admin-saved image URL directly; fallback only if missing or if image fails to decode
  const preferredImage = banner?.imageUrl?.trim() || approvedHeroImage;
  const imageSource = failedImageSources.includes(preferredImage) ? approvedHeroImage : preferredImage;
  const imageUnavailable = failedImageSources.includes(imageSource);

  const getFocalPositionClass = (pos?: string | null) => {
    switch (pos?.toUpperCase()) {
      case "LEFT":
        return "object-cover object-left sm:object-[25%_center] lg:object-[30%_center]";
      case "CENTER":
        return "object-cover object-center";
      case "RIGHT":
      default:
        return "object-cover object-[70%_center] sm:object-[75%_center] lg:object-[78%_center] xl:object-[72%_30%]";
    }
  };

  return (
    <section
      aria-label="PREHERITAGE Campaign Showcase"
      className="relative isolate min-h-[72vh] sm:min-h-[78vh] lg:min-h-[84vh] lg:max-h-[900px] w-full overflow-hidden bg-[#24201D] flex items-center"
    >
      {/* Background Editorial Hero Image */}
      {!imageUnavailable && (
        <div className="absolute inset-0 h-full w-full">
          <Image
            src={imageSource}
            alt={title}
            fill
            priority
            quality={92}
            unoptimized={imageSource.startsWith("/api/storage/")}
            sizes="100vw"
            onError={() =>
              setFailedImageSources((sources) =>
                sources.includes(imageSource) ? sources : [...sources, imageSource]
              )
            }
            className={getFocalPositionClass(banner?.position)}
          />
        </div>
      )}

      {/* Calibrated Editorial Scrim: Ensures crystal text legibility while keeping weaver attire luminous */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#24201D] via-[#24201D]/60 to-transparent sm:bg-gradient-to-r sm:from-[#24201D]/90 sm:via-[#24201D]/55 sm:to-transparent sm:w-[65%] lg:w-[56%] pointer-events-none z-10"
      />

      {/* Subtle bottom transition vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#24201D]/80 to-transparent pointer-events-none z-10"
      />

      {/* Foreground Editorial Content */}
      <div className="relative z-20 mx-auto flex h-full w-full max-w-[1440px] items-center px-5 py-16 sm:px-8 sm:py-20 lg:px-14 lg:py-24">
        <div className="max-w-lg sm:max-w-xl lg:max-w-2xl text-left text-[#F8F2E7]">
          {/* Eyebrow: Editorial brand positioning */}
          <div className="mb-4 sm:mb-5 flex items-center gap-2.5">
            <span className="h-px w-6 sm:w-8 bg-[#B08A45]" aria-hidden="true" />
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.32em] text-[#C5A869]">
              INDIAN SOUL · GLOBAL LUXURY · TIMELESS IDENTITY
            </p>
          </div>

          {/* Master Headline: Cormorant Garamond Editorial Serif */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-[74px] xl:text-[82px] font-normal leading-[1.04] sm:leading-[1.01] tracking-[-0.02em] text-white drop-shadow-md">
            <span>Many Stories.</span>
            <br />
            <span className="italic font-light text-[#F8F2E7]">One Thread.</span>
          </h1>

          {/* Subtitle & Textile Provenance Description */}
          <div className="mt-4 sm:mt-5 space-y-2.5 sm:space-y-3">
            <p className="font-serif text-lg sm:text-2xl italic leading-snug text-[#F8F2E7] drop-shadow-xs max-w-xl">
              {subtitle}
            </p>
            <p className="text-xs sm:text-sm lg:text-[15px] leading-relaxed text-[#D0C3AE] font-light max-w-lg">
              Handcrafted across India&apos;s sacred master weaving corridors—pure Katan silks, Changthangi Pashmina, and royal single-loom heirlooms carrying centuries of generational artistry forward.
            </p>
          </div>

          {/* Luxury High-Contrast Calls to Action */}
          <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-3.5 sm:gap-5">
            <Link
              href={ctaLink}
              className="group inline-flex min-h-[48px] sm:min-h-[52px] items-center gap-3.5 bg-[#F8F2E7] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#24201D] transition-all hover:bg-[#B08A45] hover:text-[#FAF8F5] shadow-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
            >
              <span>{ctaText}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>

            <Link
              href="/about"
              className="inline-flex min-h-[48px] sm:min-h-[52px] items-center border border-[#F8F2E7]/70 bg-[#24201D]/40 backdrop-blur-xs px-7 py-3.5 text-xs uppercase tracking-[0.18em] font-medium text-[#F8F2E7] transition-all hover:border-[#B08A45] hover:text-[#B08A45] hover:bg-[#24201D]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
            >
              The Artisan Memoir
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
