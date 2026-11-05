"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type Line = {
  orderItemTitle: string;
  status: "added" | "partial" | "unavailable" | "invalid";
  addedQuantity: number;
  requestedQuantity: number | null;
  previousPrice: number | null;
  currentPrice: number | null;
  priceChanged: boolean;
  message: string;
};

export function CustomerOrderPurchaseActions({ orderNumber }: { orderNumber: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const reorder = async () => {
    if (busy) return;
    setBusy(true); setMessage(""); setLines([]);
    try {
      const response = await fetch(`/api/account/orders/${encodeURIComponent(orderNumber)}/reorder`, { method: "POST" });
      const result = await response.json();
      setMessage(result.message || (response.ok ? "Cart updated." : "We could not rebuild your cart."));
      if (response.ok && Array.isArray(result.lines)) setLines(result.lines);
    } catch {
      setMessage("We could not rebuild your cart. Please retry.");
    } finally { setBusy(false); }
  };

  return <section className="mt-4 border-t border-ivory-200 pt-4">
    <div className="flex flex-wrap gap-3">
      <a href={`/api/account/orders/${encodeURIComponent(orderNumber)}/invoice`} target="_blank" rel="noreferrer" className="rounded border border-charcoal-300 px-4 py-2 text-xs font-semibold text-charcoal-800">View / print invoice</a>
      <button type="button" disabled={busy} onClick={() => void reorder()} className="rounded bg-charcoal-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Checking items…" : "Reorder"}</button>
    </div>
    {message && <div className="mt-3 space-y-2" role="status"><p className="text-xs text-charcoal-600">{message}</p>
      {lines.length > 0 && <ul className="space-y-2 text-xs">{lines.map((line, index) => <li key={`${line.orderItemTitle}-${index}`} className="rounded border border-ivory-300 bg-white p-3">
        <p className="font-semibold text-charcoal-900">{line.orderItemTitle}: {line.status.replaceAll("_", " ")}</p>
        <p className="mt-1 text-charcoal-500">{line.message}</p>
        {line.priceChanged && <p className="mt-1 text-charcoal-600">Previous recorded price: {line.previousPrice === null ? "Unavailable" : formatPrice(line.previousPrice)} · Current price: {line.currentPrice === null ? "Unavailable" : formatPrice(line.currentPrice)}</p>}
      </li>)}</ul>}
      {lines.some((line) => line.addedQuantity > 0) && <Link href="/cart" className="inline-flex rounded border border-gold-700 px-4 py-2 text-xs font-semibold text-gold-900">Review updated cart</Link>}
      <p className="text-[11px] text-charcoal-500">Reorder only updates your cart. Current prices and availability apply at checkout.</p>
    </div>}
  </section>;
}
