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
    <section className="py-20 sm:py-24 bg-ivory-50 border-b border-ivory-300 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={50}>
          <div className="text-center max-w-xl mx-auto mb-12">
            <a
              href="https://instagram.com/preheritage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.26em] text-gold-600 hover:text-gold-700 transition-colors font-semibold mb-2"
            >
              <Instagram className="w-4 h-4" />
              <span>@preheritage</span>
            </a>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal-900 leading-tight">
              Follow the Heritage Journey
            </h2>
            <p className="text-xs text-charcoal-50 font-light mt-2 tracking-wide">
              Tag #PreheritageStories to be featured in our curated salon gallery.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {instagramPosts.map((post, index) => (
            <ScrollReveal
              key={post.id}
              direction="up"
              delayMs={index * 90}
              durationMs={700}
            >
              <a
                href="https://instagram.com/preheritage"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square rounded-xs overflow-hidden bg-ivory-200 border border-ivory-300 hover:border-gold-400 transition-all duration-300 shadow-luxury hover:shadow-luxury-lg luxury-card-lift"
                aria-label={`View Instagram post: ${post.caption}`}
              >
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-charcoal-950/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-5 text-center text-ivory-50 backdrop-blur-xs">
                  <Instagram className="w-6 h-6 text-gold-300 mb-2 transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300" />
                  <p className="text-xs font-serif italic text-ivory-100 line-clamp-2 leading-relaxed">
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
