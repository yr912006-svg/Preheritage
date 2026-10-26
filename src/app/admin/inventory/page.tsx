"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Layers, AlertTriangle, Plus, Minus, Search, Check } from "lucide-react";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState(
    SAMPLE_PRODUCTS.map((p) => ({
      id: p.id,
      title: p.title,
      sku: p.sku,
      image: p.images[0],
      stock: p.stock,
      lowStockAlert: 5,
    }))
  );

  const updateStock = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">Inventory & Loom Stock Control</h1>
        <p className="text-xs text-charcoal-100 font-light mt-1">
          Monitor variant-level inventories, trigger restock dispatches, and manage low-stock thresholds
        </p>
      </div>

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
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                    <span className="font-serif font-bold text-sm text-charcoal-900 line-clamp-1">{item.title}</span>
                  </td>
                  <td className="p-4 font-mono text-xs">{item.sku}</td>
                  <td className="p-4 font-bold text-sm">{item.stock} units</td>
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
                    <div className="inline-flex items-center border border-ivory-300 rounded bg-white">
                      <button
                        onClick={() => updateStock(item.id, -1)}
                        className="px-2 py-1 text-charcoal-400 hover:text-charcoal-900 font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 font-mono font-bold">{item.stock}</span>
                      <button
                        onClick={() => updateStock(item.id, +1)}
                        className="px-2 py-1 text-charcoal-400 hover:text-charcoal-900 font-bold"
                      >
                        +
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
