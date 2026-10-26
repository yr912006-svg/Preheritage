"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProductItem } from "@/lib/sample-data";
import ProductCard from "@/components/shop/ProductCard";

export function WishlistGrid({ products: initialProducts }: { products: ProductItem[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [error, setError] = useState("");
  const remove = async (productId: string) => {
    setError("");
    const response = await fetch("/api/account/wishlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
    const data = await response.json();
    if (!response.ok) { setError(data.message || "Could not update your wishlist."); return; }
    setProducts((previous) => previous.filter((product) => product.id !== productId));
  };
  if (!products.length) return <section className="rounded-sm border border-ivory-300 bg-ivory-50 p-10 text-center"><h2 className="font-serif text-xl font-semibold text-charcoal-900">Your wishlist is waiting</h2><p className="mt-2 text-sm text-charcoal-400">Save pieces you love and find them here later.</p><Link href="/shop" className="mt-5 inline-flex rounded bg-charcoal-900 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white">Browse collections</Link></section>;
  return <div>{error && <p role="alert" className="mb-4 text-sm text-rose-700">{error}</p>}<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <div key={product.id} className="space-y-2"><ProductCard product={product} /><button type="button" onClick={() => void remove(product.id)} className="text-xs font-semibold text-rose-700 hover:underline">Remove from wishlist</button></div>)}</div></div>;
}
