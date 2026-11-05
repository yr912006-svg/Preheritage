"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const heroRef = useRef<HTMLElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // Parallax tracking refs to avoid React re-renders on mousemove
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const rafId = useRef<number | null>(null);
  const isRunning = useRef(false);

  // Banner content resolution directly from database/admin record or fallback
  const title = banner?.title?.trim() || "Many Stories. One Thread.";
  const subtitle = banner?.subtitle?.trim() || "Discover India's living textile heritage, woven by master artisans.";
  const ctaText = banner?.tagline?.trim() || "Explore the Collection";
  const ctaLink = banner?.link?.trim() || "/shop";

  // Use the admin-saved image URL directly; fallback only if missing or if image fails to decode
  const preferredImage = banner?.imageUrl?.trim() || approvedHeroImage;
  const imageSource = failedImageSources.includes(preferredImage) ? approvedHeroImage : preferredImage;
  const imageUnavailable = failedImageSources.includes(imageSource);

  // Smooth lerp animation loop for parallax
  const updateParallax = useCallback(() => {
    // Lerp factor
    const ease = 0.06;
    currentX.current += (targetX.current - currentX.current) * ease;
    currentY.current += (targetY.current - currentY.current) * ease;

    if (imageWrapperRef.current) {
      // Subtle displacement: max 12px horizontal, 8px vertical
      const translateX = currentX.current * 12;
      const translateY = currentY.current * 8;
      imageWrapperRef.current.style.transform = `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(1.02)`;
    }

    // Stop rAF loop when near rest to save CPU
    const deltaX = Math.abs(targetX.current - currentX.current);
    const deltaY = Math.abs(targetY.current - currentY.current);
    if (deltaX > 0.001 || deltaY > 0.001) {
      rafId.current = requestAnimationFrame(updateParallax);
    } else {
      isRunning.current = false;
      rafId.current = null;
    }
  }, []);

  const startParallaxLoop = useCallback(() => {
    if (!isRunning.current) {
      isRunning.current = true;
      rafId.current = requestAnimationFrame(updateParallax);
    }
  }, [updateParallax]);

  useEffect(() => {
    // Strictly enable parallax only on desktop with fine pointer and no reduced motion preference
    if (typeof window === "undefined") return;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!finePointer || prefersReducedMotion) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to [-1, 1] relative to viewport center
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      targetX.current = Math.max(-1, Math.min(1, normX));
      targetY.current = Math.max(-1, Math.min(1, normY));
      startParallaxLoop();
    };

    const handleMouseLeave = () => {
      // Return gently to center
      targetX.current = 0;
      targetY.current = 0;
      startParallaxLoop();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [startParallaxLoop]);

  const getFocalPositionClass = (pos?: string | null) => {
    switch (pos?.toUpperCase()) {
      case "LEFT":
        return "object-cover object-left sm:object-[25%_center] lg:object-[30%_center] xl:object-[30%_28%] 2xl:object-[30%_28%]";
      case "CENTER":
        return "object-cover object-center xl:object-[50%_28%] 2xl:object-[50%_28%]";
      case "RIGHT":
      default:
        return "object-cover object-[72%_center] sm:object-[75%_center] lg:object-[80%_center] xl:object-[72%_28%] 2xl:object-[72%_28%]";
    }
  };

  return (
    <section
      ref={heroRef}
      aria-label="PREHERITAGE Campaign Showcase"
      className="relative isolate min-h-[70vh] sm:min-h-[76vh] lg:min-h-[82vh] lg:max-h-[880px] w-full overflow-hidden bg-charcoal-900 flex items-center"
    >
      {/* Layer 1: Cinematic Parallax & Subtle Zoom Hero Image Container */}
      {!imageUnavailable && (
        <div
          ref={imageWrapperRef}
          className="absolute inset-[-3%] h-[106%] w-[106%] will-change-transform motion-reduce:transform-none motion-reduce:inset-0 motion-reduce:h-full motion-reduce:w-full animate-hero-zoom"
          style={{ transform: "scale(1.02)" }}
        >
          <Image
            src={imageSource}
            alt={title}
            fill
            priority
            quality={90}
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

      {/* Layer 2: Subtle Horizontal Gradient for text contrast on left, keeping model illuminated on right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-charcoal-950/90 via-charcoal-950/50 to-transparent sm:w-[70%] lg:w-[58%] pointer-events-none z-10"
      />

      {/* Layer 3: Subtle Bottom Vignette for seamless section transitions */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-charcoal-950/60 to-transparent pointer-events-none z-10"
      />

      {/* Foreground Editorial Narrative */}
      <div className="relative z-20 mx-auto flex h-full w-full max-w-[1440px] items-center px-6 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <div className="max-w-md sm:max-w-xl lg:max-w-2xl text-left text-ivory-50">
          {/* Eyebrow: Editorial brand positioning */}
          <div className="animate-hero-fade-1">
            <p className="mb-4 inline-flex items-center gap-2.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.32em] text-gold-300 sm:mb-5 sm:text-xs sm:tracking-[0.35em]">
              <span>INDIAN SOUL</span>
              <span className="text-gold-400/80">·</span>
              <span>GLOBAL LUXURY</span>
            </p>
          </div>

          {/* Master Headline: Cormorant Garamond Editorial Serif */}
          <div className="animate-hero-fade-2">
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[76px] xl:text-[84px] font-normal leading-[1.04] sm:leading-[1.0] tracking-[-0.025em] text-white drop-shadow-md">
              {title}
            </h1>
          </div>

          {/* Subtitle & Textile Provenance Description */}
          <div className="animate-hero-fade-3">
            <p className="mt-3.5 sm:mt-5 font-serif text-lg sm:text-2xl italic leading-snug text-ivory-100 drop-shadow-sm max-w-xl">
              {subtitle}
            </p>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm lg:text-base leading-relaxed text-ivory-200/90 font-light max-w-lg">
              Handcrafted across India&apos;s sacred master weaving corridors—pure Katan silks, Changthangi Pashmina, and royal single-loom heirlooms carrying centuries of generational artistry forward.
            </p>
          </div>

          {/* Calls to Action */}
          <div className="animate-hero-fade-4 mt-7 sm:mt-9 flex flex-wrap items-center gap-4 sm:gap-5">
            <Link
              href={ctaLink}
              className="cta-shimmer-btn group inline-flex min-h-[46px] sm:min-h-[50px] items-center gap-4 bg-ivory-100 px-6 py-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-900 transition-all hover:bg-gold-200 hover:text-charcoal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-900 shadow-luxury"
            >
              <span>{ctaText}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>

            <Link
              href="/about"
              className="inline-flex min-h-[46px] sm:min-h-[50px] items-center border border-ivory-200/60 bg-charcoal-900/40 backdrop-blur-xs px-6 py-3 text-[11px] sm:text-xs uppercase tracking-[0.18em] text-ivory-50 transition-all hover:border-gold-300 hover:text-gold-300 hover:bg-charcoal-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
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
