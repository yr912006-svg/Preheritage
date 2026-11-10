"use client";

import React from "react";
import Image from "next/image";
import { Instagram } from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";

const instagramPosts = [
  {
    id: "ig-1",
    image: "/images/social/social-kadwa-threads.jpg",
    caption: "The golden threads of Varanasi Kadwa weave.",
  },
  {
    id: "ig-2",
    image: "/images/social/social-chanderi-kurtas.jpg",
    caption: "Awadhi kurtas in handspun Chanderi silk-cotton.",
  },
  {
    id: "ig-3",
    image: "/images/social/social-gota-patti-lehenga.jpg",
    caption: "Royal Rajputana Gota Patti lehenga flair.",
  },
  {
    id: "ig-4",
    image: "/images/social/social-pashmina-cashmere.jpg",
    caption: "High altitude Changthangi Pashmina cashmere.",
  },
];

export const SocialFeed: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#F8F2E7] border-b border-[#E8DFC8] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={50}>
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
            <a
              href="https://instagram.com/preheritage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-[#B08A45] hover:text-[#24201D] transition-colors font-semibold mb-2"
            >
              <Instagram className="w-4 h-4 text-[#B08A45]" />
              <span>@preheritage</span>
            </a>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#24201D] leading-tight">
              Follow the Heritage Journey
            </h2>
            <p className="text-xs sm:text-sm text-[#24201D]/70 font-light mt-2 tracking-wide">
              Tag <span className="font-medium text-[#24201D]">#PreheritageStories</span> to be featured in our curated salon gallery.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {instagramPosts.map((post, index) => (
            <ScrollReveal
              key={post.id}
              direction="up"
              delayMs={index * 80}
              durationMs={700}
            >
              <a
                href="https://instagram.com/preheritage"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square rounded-xs overflow-hidden bg-[#FAF6EF] border border-[#E8DFC8] hover:border-[#B08A45] transition-all duration-500 shadow-luxury hover:shadow-luxury-lg luxury-card-lift"
                aria-label={`View Instagram post: ${post.caption}`}
              >
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-[#24201D]/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-5 text-center text-[#F8F2E7] backdrop-blur-xs">
                  <Instagram className="w-6 h-6 text-[#C5A869] mb-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                  <p className="text-xs font-serif italic text-[#F8F2E7] line-clamp-2 leading-relaxed">
                    {post.caption}
                  </p>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialFeed;
