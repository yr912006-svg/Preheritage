"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Edit, Trash2, Copy, Eye, AlertCircle } from "lucide-react";
import { SAMPLE_PRODUCTS, ProductItem } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(SAMPLE_PRODUCTS);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this handcrafted creation from the catalog?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleDuplicate = (prod: ProductItem) => {
    const copy: ProductItem = {
      ...prod,
      id: `prod-${Date.now()}`,
      title: `${prod.title} (Copy)`,
      slug: `${prod.slug}-copy-${Date.now().toString().slice(-4)}`,
      sku: `${prod.sku}-COPY`,
    };
    setProducts([copy, ...products]);
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
          Total: <strong>{filtered.length}</strong> items
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
                    <div className="relative aspect-[3/4] w-12 rounded bg-ivory-200 overflow-hidden shrink-0 border border-ivory-300">
                      <Image src={prod.images[0]} alt={prod.title} fill className="object-cover" />
                    </div>
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
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] uppercase font-bold">
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-charcoal-200">
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
                        onClick={() => handleDelete(prod.id)}
                        className="p-1 hover:text-rose-600 text-rose-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
