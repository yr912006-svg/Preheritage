import React from "react";
import Image from "next/image";
import { Instagram } from "lucide-react";

const instagramPosts = [
  {
    id: "ig-1",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600",
    caption: "The golden threads of Varanasi Kadwa weave.",
  },
  {
    id: "ig-2",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
    caption: "Awadhi kurtas in handspun Chanderi silk-cotton.",
  },
  {
    id: "ig-3",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600",
    caption: "Royal Rajputana Gota Patti lehenga flair.",
  },
  {
    id: "ig-4",
    image: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&q=80&w=600",
    caption: "High altitude Changthangi Pashmina cashmere.",
  },
];

export const SocialFeed: React.FC = () => {
  return (
    <section className="py-20 bg-ivory-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-gold-600 font-semibold mb-2">
            <Instagram className="w-4 h-4" />
            <span>@preheritage</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
            Follow the Heritage Journey
          </h2>
          <p className="text-xs text-charcoal-100 font-light mt-2">
            Tag #PreheritageStories to be featured on our global royal gallery.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {instagramPosts.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/preheritage"
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square rounded-sm overflow-hidden bg-ivory-200 border border-ivory-300"
            >
              <Image
                src={post.image}
                alt={post.caption}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-charcoal-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center text-ivory-50">
                <Instagram className="w-6 h-6 text-gold-400 mb-2" />
                <p className="text-xs font-serif line-clamp-2">{post.caption}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialFeed;
