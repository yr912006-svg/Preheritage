"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { ProductItem } from "@/lib/sample-data";
import ProductCard from "@/components/shop/ProductCard";

export function WishlistGrid({ products: initialProducts }: { products: ProductItem[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [error, setError] = useState("");

  const remove = async (productId: string) => {
    setError("");
    const response = await fetch("/api/account/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message || "Could not update your wishlist.");
      return;
    }
    setProducts((previous) => previous.filter((product) => product.id !== productId));
  };

  if (!products.length) {
    return (
      <section className="rounded-xs border border-ivory-300 bg-white p-8 sm:p-12 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold-300 bg-gold-50/60 text-gold-700">
          <Heart className="h-6 w-6" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-700 block mb-1">
          Saved Heirlooms
        </span>
        <h2 className="font-serif text-2xl font-medium text-charcoal-900 sm:text-3xl">
          Your Curated Gallery is Empty
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-charcoal-600 font-light">
          Save your favourite master weaves, Pashmina stoles, and royal kurtas to reserve them when you are ready.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/shop"
            className="inline-flex min-h-11 items-center justify-center rounded-xs bg-charcoal-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 transition-colors hover:bg-gold-600"
          >
            Browse Collections
          </Link>
          <Link
            href="/collections"
            className="inline-flex min-h-11 items-center justify-center rounded-xs border border-charcoal-700 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-charcoal-900 transition-colors hover:border-gold-600 hover:text-gold-700"
          >
            Curated Capsules
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      {error && <p role="alert" className="mb-4 text-sm text-rose-700">{error}</p>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="space-y-2">
            <ProductCard product={product} />
            <button
              type="button"
              onClick={() => void remove(product.id)}
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              Remove from wishlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
