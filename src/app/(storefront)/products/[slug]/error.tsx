"use client";

import Link from "next/link";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[55vh] items-center justify-center bg-ivory-100 px-5 py-16">
      <section className="w-full max-w-lg border-y border-gold-300 py-12 text-center sm:py-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-700">PREHERITAGE</p>
        <h1 className="mt-4 font-serif text-3xl text-charcoal-900 sm:text-4xl">This story is taking a moment</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-charcoal-600">
          We couldn’t load this product just now. Please try again, or return to the collection.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="border border-charcoal-800 bg-charcoal-800 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ivory-50 transition-colors hover:bg-charcoal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600 focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/shop"
            className="border border-charcoal-300 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-800 transition-colors hover:border-gold-700 hover:text-gold-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600 focus-visible:ring-offset-2"
          >
            Browse the collection
          </Link>
        </div>
      </section>
    </main>
  );
}
