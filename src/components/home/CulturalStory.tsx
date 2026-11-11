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
    <section className="py-20 sm:py-28 lg:py-32 bg-[#F8F2E7] border-b border-[#E8DFC8] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Visual Showcase: Left Museum-Mat Frame */}
          <div className="lg:col-span-6 relative">
            <ScrollReveal direction="up" delayMs={100} durationMs={800}>
              <div className="relative aspect-[4/5] w-full rounded-xs overflow-hidden shadow-luxury-xl border border-[#E8DFC8] bg-[#FAF8F5] p-3 sm:p-4 group">
                <div className="relative h-full w-full overflow-hidden border border-[#B08A45]/30">
                  <Image
                    src={content.imageUrl || DEFAULT_HERITAGE_PHILOSOPHY.imageUrl}
                    alt={content.imageAlt || DEFAULT_HERITAGE_PHILOSOPHY.imageAlt}
                    fill
                    priority
                    unoptimized={content.imageUrl?.startsWith("/api/storage/")}
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24201D]/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>
            </ScrollReveal>

            {/* Floating Luxury Story Badge */}
            <div className="absolute -bottom-6 right-2 sm:right-6 lg:-right-4 hidden sm:block z-10">
              <ScrollReveal direction="up" delayMs={300} durationMs={800}>
                <div className="bg-[#24201D] text-[#F8F2E7] p-5 sm:p-6 rounded-xs shadow-luxury-xl max-w-xs border border-[#B08A45]/50">
                  <span className="text-[10px] tracking-[0.28em] uppercase text-[#C5A869] font-bold block mb-1.5">
                    {content.cardTitle || DEFAULT_HERITAGE_PHILOSOPHY.cardTitle}
                  </span>
                  <p className="font-serif text-base sm:text-lg italic text-[#F8F2E7] leading-snug">
                    {`“${(content.cardQuote || DEFAULT_HERITAGE_PHILOSOPHY.cardQuote).replace(/^["“]|["”]$/g, "")}”`}
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* Narrative Content: Right Column */}
          <div className="lg:col-span-6 space-y-6">
            <ScrollReveal direction="up" delayMs={150}>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-px w-6 bg-[#B08A45]" aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.28em] text-[#B08A45] font-semibold font-sans">
                  {content.eyebrow || DEFAULT_HERITAGE_PHILOSOPHY.eyebrow}
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#24201D] leading-[1.12]">
                {headingLines.length <= 1 ? (
                  headingLines[0] || DEFAULT_HERITAGE_PHILOSOPHY.heading
                ) : (
                  <>
                    {headingLines.slice(0, -1).map((line, idx) => (
                      <span key={idx}>
                        {line}
                        <br />
                      </span>
                    ))}
                    <span className="italic font-light text-[#B08A45]">
                      {headingLines[headingLines.length - 1]}
                    </span>
                  </>
                )}
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={250}>
              <div className="space-y-4 text-sm sm:text-base text-[#24201D]/85 leading-relaxed font-light">
                <p>{content.paragraph1 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph1}</p>
                <p>{content.paragraph2 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph2}</p>
                <blockquote className="border-l-2 border-[#B08A45] pl-4 py-2 italic font-serif text-[#24201D] text-lg sm:text-xl bg-[#FAF6EF] pr-3 my-2">
                  {`“${(content.highlightQuote || DEFAULT_HERITAGE_PHILOSOPHY.highlightQuote).replace(/^["“]|["”]$/g, "")}”`}
                </blockquote>
                <p>{content.paragraph3 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph3}</p>
              </div>
            </ScrollReveal>

            {/* Three Brand Pillars */}
            <ScrollReveal direction="up" delayMs={320}>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 pb-2 border-y border-[#E8DFC8] text-center">
                <div className="py-2">
                  <span className="font-serif text-sm sm:text-base font-semibold text-[#24201D] block">
                    {content.value1Title || DEFAULT_HERITAGE_PHILOSOPHY.value1Title}
                  </span>
                  <span className="text-[10px] text-[#756A60] uppercase tracking-widest block mt-0.5">
                    {content.value1Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value1Subtitle}
                  </span>
                </div>
                <div className="py-2 border-x border-[#E8DFC8]">
                  <span className="font-serif text-sm sm:text-base font-semibold text-[#24201D] block">
                    {content.value2Title || DEFAULT_HERITAGE_PHILOSOPHY.value2Title}
                  </span>
                  <span className="text-[10px] text-[#756A60] uppercase tracking-widest block mt-0.5">
                    {content.value2Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value2Subtitle}
                  </span>
                </div>
                <div className="py-2">
                  <span className="font-serif text-sm sm:text-base font-semibold text-[#24201D] block">
                    {content.value3Title || DEFAULT_HERITAGE_PHILOSOPHY.value3Title}
                  </span>
                  <span className="text-[10px] text-[#756A60] uppercase tracking-widest block mt-0.5">
                    {content.value3Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value3Subtitle}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Memoir CTA Link */}
            <ScrollReveal direction="up" delayMs={380}>
              <div className="pt-3 flex items-center gap-6">
                <Link
                  href={content.memoirLinkUrl || "/about"}
                  className="group inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] font-semibold text-[#24201D] hover:text-[#B08A45] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                >
                  <span className="border-b border-[#24201D] group-hover:border-[#B08A45] pb-0.5 transition-colors">
                    {content.memoirLinkText || DEFAULT_HERITAGE_PHILOSOPHY.memoirLinkText}
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5 text-[#B08A45]" />
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
