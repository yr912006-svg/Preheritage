"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit, Trash2, Copy, Eye, RotateCcw } from "lucide-react";
import type { ProductItem } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<(ProductItem & { status: string })[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/products").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load products.");
      setProducts(data.products);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load products.")).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatus = async (product: ProductItem & { status: string }) => {
    const nextStatus = product.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
    if (confirm(nextStatus === "ARCHIVED" ? "Archive this product from the storefront?" : "Activate this product on the storefront?")) {
      const response = await fetch(nextStatus === "ARCHIVED" ? "/api/admin/products" : "/api/admin/products", { method: nextStatus === "ARCHIVED" ? "DELETE" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextStatus === "ARCHIVED" ? { productId: product.id } : { productId: product.id, status: nextStatus }) });
      const data = await response.json();
      if (response.ok) setProducts((previous) => previous.map((item) => item.id === product.id ? { ...item, status: nextStatus } : item));
      else setError(data.message || "Could not change this product status.");
    }
  };

  const handleDuplicate = async (prod: ProductItem) => {
    const response = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ duplicateFromId: prod.id }) });
    const data = await response.json();
    if (response.ok) setProducts((previous) => [data.product, ...previous]);
    else setError(data.message || "Could not duplicate this product.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            Heirloom Product Catalog
          </h1>
          <p className="text-xs text-charcoal-100 font-light mt-1">
            Manage product images, pricing, variant inventories, and cultural narratives
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="px-5 py-2.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs font-semibold uppercase tracking-wider rounded flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Creation</span>
        </Link>
      </div>

      {error && <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}

      {/* Search Bar */}
      <div className="bg-ivory-50 p-4 rounded-sm border border-ivory-300 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU, or craft category..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-ivory-300 text-xs rounded focus:outline-none focus:border-gold-500"
          />
        </div>
        <span className="text-xs text-charcoal-100 hidden sm:inline">
          Total: <strong>{error ? "Unavailable" : loading ? "…" : filtered.length}</strong> items
        </span>
      </div>

      {/* Catalog Table */}
      <div className="bg-ivory-50 rounded-sm border border-ivory-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left divide-y divide-ivory-300">
            <thead className="bg-ivory-100 text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Piece</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Category</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-charcoal-800">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-ivory-100/60 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <ProductThumbnail src={prod.images[0]} alt={prod.title} />
                    <div>
                      <span className="font-serif font-bold text-sm text-charcoal-900 block line-clamp-1">
                        {prod.title}
                      </span>
                      <span className="text-[10px] text-gold-700 uppercase font-semibold">
                        {prod.state}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs">{prod.sku}</td>
                  <td className="p-4 capitalize">{prod.category}</td>
                  <td className="p-4 font-serif font-bold text-sm">{formatPrice(prod.price)}</td>
                  <td className="p-4">
                    <span
                      className={`font-semibold ${
                        prod.stock <= 5 ? "text-amber-700 font-bold" : "text-charcoal-900"
                      }`}
                    >
                      {prod.stock} units
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded px-2 py-0.5 text-[10px] uppercase font-bold ${prod.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : prod.status === "ARCHIVED" ? "bg-charcoal-100 text-charcoal-600" : "bg-amber-100 text-amber-800"}`}>
                      {prod.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-charcoal-200">
                      <Link
                        href={`/admin/products/${prod.id}/edit`}
                        className="p-1 hover:text-gold-700"
                        title="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/products/${prod.slug}`}
                        target="_blank"
                        className="p-1 hover:text-charcoal-900"
                        title="Preview on Store"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(prod)}
                        className="p-1 hover:text-charcoal-900"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatus(prod)}
                        className={`p-1 ${prod.status === "ARCHIVED" ? "text-emerald-700 hover:text-emerald-900" : "text-rose-500 hover:text-rose-700"}`}
                        title={prod.status === "ARCHIVED" ? "Activate" : "Archive"}
                      >
                        {prod.status === "ARCHIVED" ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {loading && <p className="p-6 text-center text-xs text-charcoal-400">Loading products…</p>}
      {!loading && products.length === 0 && !error && <p className="p-8 text-center text-sm text-charcoal-400">No products yet. Add your first creation to publish it in the storefront.</p>}
    </div>
  );
}

function ProductThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [unavailable, setUnavailable] = useState(!src);
  return <div className="relative flex aspect-[3/4] w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-ivory-300 bg-ivory-200">
    {!unavailable && src ? <Image src={src} alt={alt} fill unoptimized={src.startsWith("/api/storage/")} onError={() => setUnavailable(true)} className="object-cover" /> : <span aria-label="Image unavailable" className="font-serif text-sm font-bold text-gold-700">PH</span>}
  </div>;
}
