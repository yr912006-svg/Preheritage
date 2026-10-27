import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata = {
  title: "The Cultural Journal | Wear the Stories of India",
  description: "Stories of Indian master artisans, sacred looms, and royal textile histories.",
};

const articles = [
  {
    id: "art-1",
    title: "The Sacred Kadwa Weave of Kashi: Engraving Poetry on Mulberry Silk",
    region: "Varanasi, Uttar Pradesh",
    date: "20 October 2026",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=900",
    excerpt: "Why the Kadwa technique takes four master weavers up to six months, and why no two motifs can ever be completely identical.",
  },
  {
    id: "art-2",
    title: "Changthang at 14,000 Feet: The High-Altitude Lineage of Real Pashmina",
    region: "Ladakh & Kashmir",
    date: "15 October 2026",
    image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&q=80&w=900",
    excerpt: "Traversing the freezing Himalayan plateau with the nomadic Changpa tribes to discover the whisper-soft underfleece that conquered Europe.",
  },
  {
    id: "art-3",
    title: "Alchemy of Desert Indigo: How Kutch Ajrakh Masters Read the Stars",
    region: "Kutch, Gujarat",
    date: "08 October 2026",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=900",
    excerpt: "16 stages of washing, fermenting iron rust, tamarind gum resist, and organic madder root dyeing that outlives synthetic pigments.",
  },
];

export default function JournalPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-gold-600 font-bold mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Stories of India</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-3">
            The Preheritage Cultural Journal
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-100 font-light leading-relaxed">
            Many Stories. One Thread. Deep dives into the living traditions, weaver profiles, and textile archaeology of India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((art) => (
            <article
              key={art.id}
              className="bg-ivory-50 rounded-sm overflow-hidden border border-ivory-300 shadow-sm flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-ivory-200">
                  <Image
                    src={art.image}
                    alt={art.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 bg-charcoal-950/80 backdrop-blur-sm px-2.5 py-1 text-[10px] text-gold-300 font-semibold uppercase tracking-wider rounded">
                    {art.region}
                  </div>
                </div>

                <div className="p-6">
                  <span className="text-[11px] text-charcoal-100 block mb-2">{art.date}</span>
                  <h2 className="font-serif text-xl font-bold text-charcoal-900 group-hover:text-gold-700 transition-colors leading-snug mb-3">
                    {art.title}
                  </h2>
                  <p className="text-xs text-charcoal-200 font-light leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-charcoal-900 group-hover:text-gold-600 transition-colors">
                  <span>Read Full Chronicle</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
