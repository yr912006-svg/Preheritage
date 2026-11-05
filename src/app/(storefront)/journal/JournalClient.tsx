"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock, ArrowRight, X, Sparkles, Feather } from "lucide-react";

export interface JournalArticle {
  id: string;
  title: string;
  region: string;
  date: string;
  readTime: string;
  tag: string;
  image: string;
  excerpt: string;
  quote: {
    text: string;
    author: string;
  };
  sections: {
    heading: string;
    body: string;
  }[];
  collectionHref: string;
  collectionLabel: string;
}

interface JournalClientProps {
  articles: JournalArticle[];
}

export default function JournalClient({ articles }: JournalClientProps) {
  const [selectedArticle, setSelectedArticle] = useState<JournalArticle | null>(null);

  return (
    <>
      <section aria-label="Journal stories" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-x-8 gap-y-12 border-t border-ivory-300 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.id}
              className="group flex flex-col justify-between border border-ivory-200 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-gold-300 hover:shadow-md"
            >
              <div>
                <div className="relative aspect-[4/5] overflow-hidden bg-ivory-200">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-xs bg-charcoal-900/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ivory-100 backdrop-blur-xs">
                    {article.tag}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-ivory-200 py-3 text-[10px] font-medium uppercase tracking-[.15em] text-charcoal-500">
                  <span>{article.region}</span>
                  <div className="flex items-center gap-1.5 text-gold-700">
                    <Clock className="h-3 w-3" />
                    <span>{article.readTime}</span>
                  </div>
                </div>

                <div className="pt-4">
                  <time className="text-[11px] text-charcoal-400 block mb-1.5">{article.date}</time>
                  <h2 className="font-serif text-xl font-medium leading-snug text-charcoal-900 transition-colors group-hover:text-gold-700 sm:text-2xl">
                    {article.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-charcoal-600 line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => setSelectedArticle(article)}
                  className="inline-flex w-full items-center justify-between border-t border-ivory-200 pt-3 text-xs font-semibold uppercase tracking-widest text-charcoal-900 transition-colors hover:text-gold-600"
                >
                  <span>Read Memoir</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Full Memoir Reading Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/80 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={selectedArticle.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedArticle(null);
          }}
        >
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xs border border-ivory-300 bg-ivory-50 p-6 shadow-2xl sm:p-10">
            {/* Close Button */}
            <button
              onClick={() => setSelectedArticle(null)}
              aria-label="Close memoir"
              className="absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-ivory-300 bg-white text-charcoal-600 shadow-sm transition-colors hover:border-gold-500 hover:text-charcoal-950"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header info */}
            <div className="space-y-3 pb-6 border-b border-ivory-200 pr-12">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gold-700">
                <span className="bg-gold-50 px-2 py-0.5 border border-gold-200 rounded-xs">
                  {selectedArticle.tag}
                </span>
                <span>·</span>
                <span>{selectedArticle.region}</span>
                <span>·</span>
                <span>{selectedArticle.readTime}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold leading-tight text-charcoal-900 sm:text-3xl lg:text-4xl">
                {selectedArticle.title}
              </h2>
              <time className="text-xs text-charcoal-400 block">{selectedArticle.date}</time>
            </div>

            {/* Hero Image */}
            <div className="relative my-6 aspect-[16/9] w-full overflow-hidden rounded-xs border border-ivory-300 bg-ivory-200">
              <Image
                src={selectedArticle.image}
                alt={selectedArticle.title}
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Pull Quote */}
            <div className="my-8 rounded-xs border-l-2 border-gold-500 bg-ivory-100/70 p-5 italic text-charcoal-800">
              <p className="font-serif text-base leading-relaxed sm:text-lg">
                "{selectedArticle.quote.text}"
              </p>
              <footer className="mt-3 text-xs font-sans not-italic font-semibold tracking-wide text-charcoal-600">
                — {selectedArticle.quote.author}
              </footer>
            </div>

            {/* Narrative Body Sections */}
            <div className="space-y-6 text-sm leading-7 text-charcoal-700 sm:text-base sm:leading-8">
              {selectedArticle.sections.map((sec, idx) => (
                <div key={idx} className="space-y-2">
                  <h3 className="font-serif text-lg font-semibold text-charcoal-900 sm:text-xl">
                    {sec.heading}
                  </h3>
                  <p className="font-light text-charcoal-700">{sec.body}</p>
                </div>
              ))}
            </div>

            {/* Collection CTA Footer */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-ivory-300 pt-6">
              <div className="flex items-center gap-2 text-xs text-charcoal-600">
                <Feather className="h-4 w-4 text-gold-600" />
                <span>Documented in the PREHERITAGE Maison Archives</span>
              </div>

              <Link
                href={selectedArticle.collectionHref}
                onClick={() => setSelectedArticle(null)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xs bg-charcoal-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 transition-colors hover:bg-gold-600"
              >
                <span>{selectedArticle.collectionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

