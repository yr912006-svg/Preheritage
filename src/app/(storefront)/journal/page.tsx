import React from "react";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import JournalClient, { JournalArticle } from "./JournalClient";

export const metadata: Metadata = {
  title: "Art & Heritage Journal — Weaving Lineage & Craft Narratives | PREHERITAGE",
  description:
    "Explore the PREHERITAGE journal documenting sacred Varanasi Kadwa weaves, high-altitude Ladakh Pashmina lineages, and ancient Kutch indigo alchemy.",
  openGraph: {
    title: "Art & Heritage Journal | PREHERITAGE",
    description:
      "Explore stories of Indian textile traditions, regional heritage, and generational artisan lineages.",
    url: "https://preheritage.com/journal",
    images: [{ url: "/images/journal/journal-kadwa-weave.jpg", width: 1200, height: 630 }],
  },
  alternates: {
    canonical: "https://preheritage.com/journal",
  },
};

const articles: JournalArticle[] = [
  {
    id: "art-1",
    title: "The Sacred Kadwa Weave of Kashi: Engraving Poetry on Mulberry Silk",
    region: "Varanasi, Uttar Pradesh",
    date: "20 October 2026",
    readTime: "6 min read",
    tag: "Master Handloom",
    image: "/images/journal/journal-kadwa-weave.jpg",
    excerpt: "Why the Kadwa technique takes four master weavers up to six months, and why no two motifs can ever be completely identical.",
    quote: {
      text: "In Kadwa weaving, each motif is individually hand-engraved into the warp like an intricate miniature painting. No loose threads remain on the reverse.",
      author: "Ustad Bismillah Ansari, Master Weaver, Peeli Kothi",
    },
    sections: [
      {
        heading: "The Sanctuary of Warp and Weft",
        body: "Deep within the historic quarters of Varanasi—along the narrow stone alleys of Madanpura and Peeli Kothi—the rhythmic clatter of wooden pit looms has echoed for five centuries. Here, weaving is not an assembly line; it is a sacred meditation passed from father to son across dynasties.",
      },
      {
        heading: "The Geometry of Zero-Float",
        body: "Unlike common jacquard cutwork where threads are severed leaving scratchy floats behind, genuine Kadwa involves wrapping each motif with an individual spool of gold or silver zari. Each floral bel, paisley boteh, or royal shikargah animal motif is locked firmly into the ground silk. The underside remains as smooth as polished jade, ensuring the drape rests against bare skin with featherlight elegance.",
      },
      {
        heading: "Preserving the Real Tested Silver Zari",
        body: "PREHERITAGE commissions weavers using only electroplated 24K pure gold wrapped over tested silver core thread (Paspul zari). When cared for properly, a Kadwa saree does not tarnish with age—it matures, acquiring a warm, antique patina that grandchildren inherit as family heirlooms.",
      },
    ],
    collectionHref: "/shop?category=sarees",
    collectionLabel: "Discover Varanasi Sarees",
  },
  {
    id: "art-2",
    title: "Changthang at 14,000 Feet: The High-Altitude Lineage of Real Pashmina",
    region: "Ladakh & Kashmir",
    date: "15 October 2026",
    readTime: "8 min read",
    tag: "Nomadic Cashmere",
    image: "/images/journal/journal-pashmina-lineage.jpg",
    excerpt: "Traversing the freezing Himalayan plateau with the nomadic Changpa tribes to discover the whisper-soft underfleece that conquered Europe.",
    quote: {
      text: "The freezing cold is the master artisan; without minus forty degrees, the Capra Hircus goat never grows the down that makes authentic Pashmina a cloud.",
      author: "Tsering Angchuk, Changpa Herder, Changthang Plateau",
    },
    sections: [
      {
        heading: "The Whispering Wind of Ladakh",
        body: "At 14,000 feet above sea level in the Changthang desert of Ladakh, winter temperatures plunge below -40°C. To survive, the Capra Hircus goat develops a downy undercoat beneath its coarse outer guard hair. Each hair measures merely 12 to 15 microns in diameter—one-sixth the width of a human hair.",
      },
      {
        heading: "The Spring Comb: An Ethical Harvest",
        body: "Authentic Pashmina is never sheared. In spring, when the goats naturally shed their winter undercoats, Changpa nomads gently comb out the soft underfleece with fine wooden combs. Each goat yields less than 150 grams of usable fiber per year, making every single shawl the culmination of an entire season of nomadic care.",
      },
      {
        heading: "The Charkha Wheels of Srinagar",
        body: "Transported down into the Kashmir Valley, the unspun fleece is entrusted to master women spinners who spin the gossamer threads on traditional wooden charkhas (Yender). It is woven on handlooms with so gentle a tension that industrial machines can never replicate its airy warmth.",
      },
    ],
    collectionHref: "/shop?category=accessories",
    collectionLabel: "Discover Heirloom Pashminas",
  },
  {
    id: "art-3",
    title: "Alchemy of Desert Indigo: How Kutch Ajrakh Masters Read the Stars",
    region: "Kutch, Gujarat",
    date: "08 October 2026",
    readTime: "7 min read",
    tag: "Natural Resist Alchemy",
    image: "/images/journal/journal-desert-indigo.jpg",
    excerpt: "16 stages of washing, fermenting iron rust, tamarind gum resist, and organic madder root dyeing that outlives synthetic pigments.",
    quote: {
      text: "Ajrakh is an ode to the cosmos: blue for the twilight sky, red for the terracotta earth, and white for the luminous stars.",
      author: "Dr. Ismail Mohammed Khatri, Master Block Carver & Dyer, Dhamadka",
    },
    sections: [
      {
        heading: "The 16 Sacred Stages of Purification",
        body: "Ajrakh is an Arabic word meaning 'keep it for today' or 'blue like the sky'. Creating a single bolt of Ajrakh requires 16 meticulous washings, boilings, and resist applications over three weeks. The fabric is treated with harda (myrobalan) seed tannin, river washed, and sun-bleached on desert sandbanks.",
      },
      {
        heading: "Living Subterranean Fermentations",
        body: "Real indigo is not a chemical powder mixed in a vat; it is a living organism. Fermented inside subterranean clay pots with jaggery, date paste, iron scrap, and lime, the master dyers check the fragrance, taste, and bubble froth of the vat each morning before immersing the fabric.",
      },
      {
        heading: "Double-Sided Block Alignment",
        body: "The hallmark of royal Ajrakh is double-sided block printing (Bikari). Carved wooden blocks of teak and sesham are aligned by hand with pinpoint millimeter accuracy on both the front and reverse of the fabric, ensuring that the geometric celestial pattern is equally vibrant from either side.",
      },
    ],
    collectionHref: "/shop?category=kurtas",
    collectionLabel: "Discover Hand-Printed Kurtas",
  },
];

export default function JournalPage() {
  return (
    <main className="min-h-screen bg-ivory-100 pb-20">
      <header className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:px-8">
        <div className="grid items-end gap-6 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.24em] text-gold-800 sm:text-xs">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Art &amp; Heritage
            </div>
            <h1 className="max-w-[12ch] font-serif text-5xl font-normal leading-[.98] text-charcoal-900 sm:text-6xl lg:text-7xl">
              The cultural journal
            </h1>
          </div>
          <p className="max-w-lg text-sm leading-7 text-charcoal-600 md:col-span-5 md:justify-self-end sm:text-base">
            Curated narratives from the PREHERITAGE archives documenting regional textile lineages, master artisan workshops, and sacred handloom alchemies.
          </p>
        </div>
      </header>

      <JournalClient articles={articles} />
    </main>
  );
}
