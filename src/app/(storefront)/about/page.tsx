import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Compass, Shield, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "The Atelier Memoir — Don’t Just Wear Heritage. Carry It Forward | PREHERITAGE",
  description:
    "PREHERITAGE — Indian soul, global luxury, timeless identity. Wear the Stories of India. Discover our founding philosophy, master weaver guilds, and heirloom provenance.",
  openGraph: {
    title: "The Atelier Memoir | PREHERITAGE",
    description:
      "PREHERITAGE — Indian soul, global luxury, timeless identity. Don’t Just Wear Heritage. Carry It Forward.",
    url: "https://preheritage.com/about",
    images: [{ url: "/images/campaign/artisan-master-loom.jpg", width: 1200, height: 675 }],
  },
  alternates: {
    canonical: "https://preheritage.com/about",
  },
};

const principles = [
  {
    num: "01",
    title: "Indian Soul",
    subtitle: "Sacred Textile Vocabulary",
    text: "Rooted in the living traditions of Varanasi, Kanchipuram, Chanderi, and Kutch, honoring centuries of unwritten mathematical weaving codes.",
  },
  {
    num: "02",
    title: "Global Luxury",
    subtitle: "Couture Architecture",
    text: "Positioned on the world stage alongside international couture houses, refusing synthetic compromises and celebrating raw material purity.",
  },
  {
    num: "03",
    title: "Timeless Identity",
    subtitle: "Living Heirloom Lineage",
    text: "Creating pieces destined to be passed between mothers, daughters, and generations—carrying stories forward rather than letting them fade.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-ivory text-charcoal pb-24">
      {/* Editorial Opening */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:pt-20 border-b border-stone-300">
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-[10.5px] uppercase tracking-[0.25em] font-medium text-gold">
              The Maison Memoir
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-light text-charcoal leading-[1.02] tracking-tight">
            Wear the stories of India.
          </h1>

          <p className="font-serif italic text-2xl sm:text-3xl text-charcoal/80 font-light leading-snug">
            Don’t Just Wear Heritage. <br />
            <span className="text-gold">Carry It Forward.</span>
          </p>

          <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed max-w-lg">
            PREHERITAGE was born from a singular refusal: that India&apos;s sacred handlooms should never be reduced to mass souvenir markets or synthetic imitations. We curate unrepeatable single-loom textiles directly from master artisan guilds.
          </p>

          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex min-h-[48px] items-center gap-3 px-8 py-3.5 bg-charcoal text-ivory text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-gold hover:text-charcoal transition-all duration-300 shadow-md"
            >
              <span>Explore The Curated Vault</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden border border-stone-300 shadow-luxury lg:col-span-6">
          <Image
            src="/images/campaign/artisan-master-loom.jpg"
            alt="Master artisan at Varanasi pit-loom"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={90}
            className="object-cover object-center"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-charcoal/85 backdrop-blur-sm p-4 border border-stone-700 text-ivory">
            <span className="text-[10px] uppercase tracking-widest text-gold font-medium block">
              The Living Loom
            </span>
            <p className="font-serif italic text-xs text-stone-200 mt-0.5">
              Continuous hand-shuttled fine silk and gold-tone zari on a traditional Varanasi pit-loom.
            </p>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section className="border-b border-stone-300 bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-[1px] w-6 bg-gold" />
              <p className="text-[10.5px] font-medium uppercase tracking-[0.25em] text-gold">
                The Founding Conviction
              </p>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-charcoal tracking-tight">
              Many Stories. <br />
              <span className="italic text-stone-400">One Thread.</span>
            </h2>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-stone-600 font-light leading-relaxed lg:col-span-7">
            <p>
              India’s handloom lexicon is not a museum relic; it is an active, breathing architecture of form. From the delicate korvai interlocking borders of Kanchipuram to the discontinuous floral motifs of Varanasi Kadwa, each yard represents an intellectual tradition refined over millennia.
            </p>
            <p>
              When a patron wears a PREHERITAGE piece, they do not simply consume an aesthetic. They become the custodian of an artisan&apos;s labor, an oral lineage, and a sovereign textile identity.
            </p>
          </div>
        </div>
      </section>

      {/* The Three House Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mb-12 max-w-xl">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.25em] text-gold">
            House Pillars
          </p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-light text-charcoal">
            The Haute Standards of Maison Preheritage
          </h2>
        </div>

        <div className="grid gap-8 border-t border-stone-300 pt-8 sm:grid-cols-3 sm:gap-8">
          {principles.map((principle) => (
            <article key={principle.title} className="p-6 bg-white border border-stone-200">
              <span className="text-xs font-mono tracking-widest text-gold">{principle.num}</span>
              <h3 className="mt-3 font-serif text-2xl font-normal text-charcoal">{principle.title}</h3>
              <p className="text-[11px] uppercase tracking-wider text-stone-400 font-medium mb-3">
                {principle.subtitle}
              </p>
              <p className="text-xs text-stone-600 font-light leading-relaxed">{principle.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
