import prisma from "@/lib/prisma";

export type HeritagePhilosophyContent = {
  id?: string;
  imageUrl: string;
  imageAlt: string;
  eyebrow: string;
  heading: string;
  paragraph1: string;
  paragraph2: string;
  highlightQuote: string;
  paragraph3: string;
  value1Title: string;
  value1Subtitle: string;
  value2Title: string;
  value2Subtitle: string;
  value3Title: string;
  value3Subtitle: string;
  cardTitle: string;
  cardQuote: string;
  memoirLinkText: string;
  memoirLinkUrl: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export const DEFAULT_HERITAGE_PHILOSOPHY: HeritagePhilosophyContent = {
  id: "default",
  imageUrl: "/images/story/artisan-pit-loom.jpg",
  imageAlt: "Master artisan weaving traditional Indian handloom textile on wooden pit loom",
  eyebrow: "The Philosophy of Preheritage",
  heading: "Many Stories.\nOne Thread.",
  paragraph1:
    "In an era of relentless fast fashion and synthetic replicas, PREHERITAGE was founded on a reverent commitment: to revive, celebrate, and carry forward India's royal weaving traditions for the modern world.",
  paragraph2:
    "Every fold of pure Katan silk, every touch of Changthangi cashmere, and every stroke of Ajrakh natural block print is an unbroken dialogue with centuries of generational master artisans.",
  highlightQuote: "Don’t Just Wear Heritage. Carry It Forward.",
  paragraph3:
    "When you choose Preheritage, you are not merely purchasing attire. You are preserving an ancient art form, empowering weaver families across India's master textile clusters, and donning a piece of living history.",
  value1Title: "Indian Soul",
  value1Subtitle: "Living Roots",
  value2Title: "Global Luxury",
  value2Subtitle: "Zero Compromise",
  value3Title: "Timeless",
  value3Subtitle: "Family Heirlooms",
  cardTitle: "Sacred Craft Lineage",
  cardQuote: "A single Varanasi Katan saree requires up to 180 days of patient hand-knotting.",
  memoirLinkText: "Read The Full Heritage Memoir",
  memoirLinkUrl: "/about",
};

export async function getHeritagePhilosophy(): Promise<HeritagePhilosophyContent> {
  try {
    const record = await prisma.heritagePhilosophy.findUnique({
      where: { id: "default" },
    });

    if (!record) {
      return DEFAULT_HERITAGE_PHILOSOPHY;
    }

    return {
      id: record.id,
      imageUrl: record.imageUrl || DEFAULT_HERITAGE_PHILOSOPHY.imageUrl,
      imageAlt: record.imageAlt || DEFAULT_HERITAGE_PHILOSOPHY.imageAlt,
      eyebrow: record.eyebrow || DEFAULT_HERITAGE_PHILOSOPHY.eyebrow,
      heading: record.heading || DEFAULT_HERITAGE_PHILOSOPHY.heading,
      paragraph1: record.paragraph1 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph1,
      paragraph2: record.paragraph2 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph2,
      highlightQuote: record.highlightQuote || DEFAULT_HERITAGE_PHILOSOPHY.highlightQuote,
      paragraph3: record.paragraph3 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph3,
      value1Title: record.value1Title || DEFAULT_HERITAGE_PHILOSOPHY.value1Title,
      value1Subtitle: record.value1Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value1Subtitle,
      value2Title: record.value2Title || DEFAULT_HERITAGE_PHILOSOPHY.value2Title,
      value2Subtitle: record.value2Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value2Subtitle,
      value3Title: record.value3Title || DEFAULT_HERITAGE_PHILOSOPHY.value3Title,
      value3Subtitle: record.value3Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value3Subtitle,
      cardTitle: record.cardTitle || DEFAULT_HERITAGE_PHILOSOPHY.cardTitle,
      cardQuote: record.cardQuote || DEFAULT_HERITAGE_PHILOSOPHY.cardQuote,
      memoirLinkText: record.memoirLinkText || DEFAULT_HERITAGE_PHILOSOPHY.memoirLinkText,
      memoirLinkUrl: record.memoirLinkUrl || DEFAULT_HERITAGE_PHILOSOPHY.memoirLinkUrl,
      updatedAt: record.updatedAt,
      createdAt: record.createdAt,
    };
  } catch (error) {
    console.error("Failed to load heritage philosophy from DB, using fallback:", error);
    return DEFAULT_HERITAGE_PHILOSOPHY;
  }
}

export async function saveHeritagePhilosophy(
  data: Partial<HeritagePhilosophyContent>
): Promise<HeritagePhilosophyContent> {
  const merged: HeritagePhilosophyContent = {
    imageUrl: (data.imageUrl || DEFAULT_HERITAGE_PHILOSOPHY.imageUrl).trim(),
    imageAlt: (data.imageAlt || DEFAULT_HERITAGE_PHILOSOPHY.imageAlt).trim(),
    eyebrow: (data.eyebrow || DEFAULT_HERITAGE_PHILOSOPHY.eyebrow).trim(),
    heading: (data.heading || DEFAULT_HERITAGE_PHILOSOPHY.heading).trim(),
    paragraph1: (data.paragraph1 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph1).trim(),
    paragraph2: (data.paragraph2 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph2).trim(),
    highlightQuote: (data.highlightQuote || DEFAULT_HERITAGE_PHILOSOPHY.highlightQuote).trim(),
    paragraph3: (data.paragraph3 || DEFAULT_HERITAGE_PHILOSOPHY.paragraph3).trim(),
    value1Title: (data.value1Title || DEFAULT_HERITAGE_PHILOSOPHY.value1Title).trim(),
    value1Subtitle: (data.value1Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value1Subtitle).trim(),
    value2Title: (data.value2Title || DEFAULT_HERITAGE_PHILOSOPHY.value2Title).trim(),
    value2Subtitle: (data.value2Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value2Subtitle).trim(),
    value3Title: (data.value3Title || DEFAULT_HERITAGE_PHILOSOPHY.value3Title).trim(),
    value3Subtitle: (data.value3Subtitle || DEFAULT_HERITAGE_PHILOSOPHY.value3Subtitle).trim(),
    cardTitle: (data.cardTitle || DEFAULT_HERITAGE_PHILOSOPHY.cardTitle).trim(),
    cardQuote: (data.cardQuote || DEFAULT_HERITAGE_PHILOSOPHY.cardQuote).trim(),
    memoirLinkText: (data.memoirLinkText || DEFAULT_HERITAGE_PHILOSOPHY.memoirLinkText).trim(),
    memoirLinkUrl: (data.memoirLinkUrl || DEFAULT_HERITAGE_PHILOSOPHY.memoirLinkUrl).trim(),
  };

  const record = await prisma.heritagePhilosophy.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...merged,
    },
    update: {
      ...merged,
    },
  });

  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/");
    revalidatePath("/admin/content");
  } catch {}

  return {
    id: record.id,
    imageUrl: record.imageUrl,
    imageAlt: record.imageAlt,
    eyebrow: record.eyebrow,
    heading: record.heading,
    paragraph1: record.paragraph1,
    paragraph2: record.paragraph2,
    highlightQuote: record.highlightQuote,
    paragraph3: record.paragraph3,
    value1Title: record.value1Title,
    value1Subtitle: record.value1Subtitle,
    value2Title: record.value2Title,
    value2Subtitle: record.value2Subtitle,
    value3Title: record.value3Title,
    value3Subtitle: record.value3Subtitle,
    cardTitle: record.cardTitle,
    cardQuote: record.cardQuote,
    memoirLinkText: record.memoirLinkText,
    memoirLinkUrl: record.memoirLinkUrl,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
  };
}
