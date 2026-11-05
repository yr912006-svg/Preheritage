"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import type { HeritagePhilosophyContent } from "@/lib/heritage-philosophy";
import { DEFAULT_HERITAGE_PHILOSOPHY } from "@/lib/heritage-philosophy";

interface CulturalStoryProps {
  data?: HeritagePhilosophyContent | null;
}

export const CulturalStory: React.FC<CulturalStoryProps> = ({ data }) => {
  const content = data || DEFAULT_HERITAGE_PHILOSOPHY;

  const headingLines = (content.heading || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return (
    <section className="py-16 sm:py-24 lg:py-28 bg-ivory-100 border-b border-ivory-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Visual Showcase: Left */}
          <div className="lg:col-span-6 relative">
            <ScrollReveal direction="up" delayMs={100} durationMs={900}>
              <div className="relative aspect-[4/5] w-full rounded-xs overflow-hidden shadow-luxury-xl border border-ivory-300 bg-ivory-200 group">
                <Image
                  src={content.imageUrl || DEFAULT_HERITAGE_PHILOSOPHY.imageUrl}
                  alt={content.imageAlt || DEFAULT_HERITAGE_PHILOSOPHY.imageAlt}
                  fill
                  priority
                  unoptimized={content.imageUrl?.startsWith("/api/storage/")}
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </ScrollReveal>

            {/* Floating Luxury Story Badge */}
            <div className="absolute -bottom-6 right-4 sm:right-6 lg:-right-6 hidden sm:block z-10">
              <ScrollReveal direction="up" delayMs={300} durationMs={800}>
                <div className="bg-charcoal-900 text-ivory-50 p-6 rounded-xs shadow-luxury-xl max-w-xs border border-gold-500/40">
                  <span className="text-[10px] tracking-[0.28em] uppercase text-gold-400 font-bold block mb-1.5">
                    {content.cardTitle || DEFAULT_HERITAGE_PHILOSOPHY.cardTitle}
                  </span>
                  <p className="font-serif text-lg italic text-ivory-100 leading-snug">
                    &ldquo;{(content.cardQuote || DEFAULT_HERITAGE_PHILOSOPHY.cardQuote).replace(/^["“]|["”]$/g, "")}&rdquo;
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Narrative Content: Right */}
          <div className="lg:col-span-6 space-y-6">
            <ScrollReveal direction="up" delayMs={150}>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-gold-600 font-semibold font-sans">
                <span>{content.eyebrow || DEFAULT_HERITAGE_PHILOSOPHY.eyebrow}</span>
              </div>

              <h2 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-charcoal-900 leading-[1.12]">
                {headingLines.length <= 1 ? (
                  headingLines[0] || DEFAULT_HERITAGE_PHILOSOPHY.heading
                ) : (
                  <>
                    {headingLines.slice(0, -1).map((line, idx) => (
                      <React.Fragment key={idx}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                    <span className="italic font-normal text-gold-600">
                      {headingLines[headingLines.length - 1]}
                    </span>
                  </>
                )}
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={250}>
              <div className="space-y-4 text-sm sm:text-base text-charcoal-50 leading-relaxed font-light">
                <p>{content.paragraph1 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph1}</p>
                <p>{content.paragraph2 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph2}</p>
                <blockquote className="border-l-2 border-gold-500 pl-4 py-1.5 italic font-serif text-charcoal-900 text-lg sm:text-xl bg-ivory-50/60 pr-2">
                  &ldquo;{(content.highlightQuote || DEFAULT_HERITAGE_PHILOSOPHY.highlightQuote).replace(/^["“]|["”]$/g, "")}&rdquo;
                </blockquote>
                <p>{content.paragraph3 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph3}</p>
              </div>
            </ScrollReveal>

            {/* Three Brand Pillars */}
            <ScrollReveal direction="up" delayMs={320}>
              <div className="grid grid-cols-3 gap-3 pt-2 pb-1 border-y border-ivory-300 text-center">
                <div className="py-2">
                  <span className="font-serif text-sm sm:text-base font-semibold text-charcoal-900 block">
                    {content.value1Title || DEFAULT_HERITAGE_PHILOSOPHY.value1Title}
                  </span>
                  <span className="text-[10px] text-charcoal-50 uppercase tracking-widest block mt-0.5">
                    {content.value1Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value1Subtitle}
                  </span>
                </div>
                <div className="py-2 border-x border-ivory-300">
                  <span className="font-serif text-sm sm:text-base font-semibold text-charcoal-900 block">
                    {content.value2Title || DEFAULT_HERITAGE_PHILOSOPHY.value2Title}
                  </span>
                  <span className="text-[10px] text-charcoal-50 uppercase tracking-widest block mt-0.5">
                    {content.value2Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value2Subtitle}
                  </span>
                </div>
                <div className="py-2">
                  <span className="font-serif text-sm sm:text-base font-semibold text-charcoal-900 block">
                    {content.value3Title || DEFAULT_HERITAGE_PHILOSOPHY.value3Title}
                  </span>
                  <span className="text-[10px] text-charcoal-50 uppercase tracking-widest block mt-0.5">
                    {content.value3Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value3Subtitle}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={380}>
              <div className="pt-2 flex items-center gap-6">
                <Link
                  href={content.memoirLinkUrl || "/about"}
                  className="editorial-nav-link group inline-flex items-center gap-2.5 text-xs uppercase tracking-[0.2em] font-semibold text-charcoal-900 hover:text-gold-600 transition-colors pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
                >
                  <span>{content.memoirLinkText || DEFAULT_HERITAGE_PHILOSOPHY.memoirLinkText}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CulturalStory;
