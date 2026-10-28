"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Layers, AlertTriangle, Plus, Minus, Search, Check } from "lucide-react";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/admin/inventory").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load inventory.");
      setInventory(data.inventory);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load inventory.")).finally(() => setLoading(false));
  }, []);

  const updateStock = async (id: string, delta: number, variantId?: string) => {
    const response = await fetch("/api/admin/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: id, variantId, delta }) });
    const data = await response.json();
    if (!response.ok) { setError(data.message || "Could not update stock."); return; }
    setInventory((prev) => prev.map((item) => item.id === id ? { ...item, stock: data.product.stock, variants: data.product.variants } : item));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Inventory & Loom Stock Control</h1>
        <p className="text-xs text-charcoal-100 font-light mt-1">
          Monitor variant-level inventories, trigger restock dispatches, and manage low-stock thresholds
        </p>
      </div>
      {error && <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}

      <div className="bg-ivory-50 rounded-sm border border-ivory-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left divide-y divide-ivory-300">
            <thead className="bg-ivory-100 text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Handcrafted Piece</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Alert Threshold</th>
                <th className="p-4">Health Status</th>
                <th className="p-4 text-right">Quick Stock Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-charcoal-800">
              {inventory.map((item) => (
                <tr key={item.id} className="hover:bg-ivory-100/60 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="relative aspect-[3/4] w-10 rounded bg-ivory-200 overflow-hidden shrink-0 border border-ivory-300">
                      {item.image && <Image src={item.image} alt={item.title} fill unoptimized={item.image.startsWith("/api/storage/")} className="object-cover" />}
                    </div>
                    <span className="font-serif font-bold text-sm text-charcoal-900 line-clamp-1">{item.title}</span>
                  </td>
                  <td className="p-4 font-mono text-xs">{item.sku}</td>
                  <td className="p-4 font-bold text-sm">
                    {item.stock} sellable units
                    {item.variants?.length > 0 && <div className="mt-1 space-y-0.5 text-[10px] font-normal text-charcoal-400">{item.variants.map((variant: any) => <div key={variant.id}>{variant.size} / {variant.color}: {variant.stock}</div>)}</div>}
                  </td>
                  <td className="p-4 text-charcoal-100">Below {item.lowStockAlert} units</td>
                  <td className="p-4">
                    {item.stock <= item.lowStockAlert ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold uppercase text-[10px] flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase text-[10px]">
                        Optimal
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {item.variants?.length > 0 ? <div className="space-y-1">{item.variants.map((variant: any) => <div key={variant.id} className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <span className="max-w-28 truncate text-[10px] text-charcoal-400">{variant.size} / {variant.color}</span>
                      <div className="inline-flex items-center border border-ivory-300 rounded bg-white">
                        <button onClick={() => updateStock(item.id, -1, variant.id)} aria-label={`Decrease ${variant.size} ${variant.color} stock`} className="px-2 py-1 text-charcoal-400 hover:text-charcoal-900 font-bold">-</button>
                        <span className="px-2 font-mono font-bold">{variant.stock}</span>
                        <button onClick={() => updateStock(item.id, 1, variant.id)} aria-label={`Increase ${variant.size} ${variant.color} stock`} className="px-2 py-1 text-charcoal-400 hover:text-charcoal-900 font-bold">+</button>
                      </div>
                    </div>)}</div> : <div className="inline-flex items-center border border-ivory-300 rounded bg-white">
                      <button onClick={() => updateStock(item.id, -1)} className="px-2 py-1 text-charcoal-400 hover:text-charcoal-900 font-bold">-</button>
                      <span className="px-2 font-mono font-bold">{item.stock}</span>
                      <button onClick={() => updateStock(item.id, 1)} className="px-2 py-1 text-charcoal-400 hover:text-charcoal-900 font-bold">+</button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {loading && <p className="p-6 text-center text-xs text-charcoal-400">Loading inventory…</p>}
      {!loading && inventory.length === 0 && !error && <p className="p-8 text-center text-sm text-charcoal-400">No active inventory is available.</p>}
    </div>
  );
}
