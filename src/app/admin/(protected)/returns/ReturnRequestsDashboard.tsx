"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, RotateCcw, X } from "lucide-react";

type ReturnStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "ITEM_RECEIVED" | "REFUND_INITIATED" | "COMPLETED";
type ReturnRequest = {
  id: string; orderNumber: string; reason: string;
  requestType: "RETURN" | "EXCHANGE" | null; explanation: string | null;
  requestedItems: { title: string; sku: string; size: string | null; color: string | null; quantity: number }[];
  status: ReturnStatus; createdAt: string;
};

const nextStatuses: Partial<Record<ReturnStatus, { value: ReturnStatus; label: string }[]>> = {
  REQUESTED: [{ value: "APPROVED", label: "Approve request" }, { value: "REJECTED", label: "Reject request" }],
  APPROVED: [{ value: "ITEM_RECEIVED", label: "Mark item received" }],
};
const statusStyle: Record<ReturnStatus, string> = {
  REQUESTED: "bg-gold-100 text-gold-900", APPROVED: "bg-blue-100 text-blue-900",
  REJECTED: "bg-rose-100 text-rose-900", ITEM_RECEIVED: "bg-emerald-100 text-emerald-900",
  REFUND_INITIATED: "bg-charcoal-100 text-charcoal-700", COMPLETED: "bg-charcoal-100 text-charcoal-700",
};

export default function ReturnRequestsDashboard() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [selected, setSelected] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/returns", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load return requests.");
      setRequests(data.requests);
      setSelected((current) => current ? data.requests.find((item: ReturnRequest) => item.id === current.id) ?? null : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load return requests.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function transition(item: ReturnRequest, status: ReturnStatus) {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/returns", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, expectedStatus: item.status, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "This return request could not be updated.");
      setNotice("Return request status updated.");
      await load();
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "This return request could not be updated.";
      await load();
      setError(message);
    } finally { setSaving(false); }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-700">Customer Care</p><h1 className="mt-1 font-serif text-3xl font-bold text-charcoal-900">Returns &amp; Exchanges</h1><p className="mt-1 text-sm text-charcoal-500">Review submitted requests and record approved review steps.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 border border-ivory-400 bg-ivory-50 px-4 py-2 text-xs font-semibold text-charcoal-800 hover:border-gold-500 disabled:opacity-50"><RefreshCw className="h-4 w-4" />Refresh</button>
    </div>
    {notice && <p role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}
    {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}
    <div className="overflow-x-auto border border-ivory-300 bg-ivory-50">
      <table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-charcoal-900 text-[11px] uppercase tracking-wider text-ivory-100"><tr><th className="px-4 py-3">Order reference</th><th className="px-4 py-3">Requested items</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Review</th></tr></thead>
        <tbody className="divide-y divide-ivory-300">{loading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-charcoal-500">Loading return requests…</td></tr> : requests.length ? requests.map((item) => <tr key={item.id} className="hover:bg-white">
          <td className="whitespace-nowrap px-4 py-4 font-mono font-semibold text-charcoal-900">{item.orderNumber}</td>
          <td className="max-w-[260px] px-4 py-4">{item.requestedItems.length ? item.requestedItems.map((requested, index) => <span key={`${requested.sku}-${index}`} className="block truncate">{requested.title} × {requested.quantity}</span>) : <span className="text-charcoal-400">Item details unavailable</span>}</td>
          <td className="max-w-[200px] px-4 py-4">{item.reason}</td>
          <td className="whitespace-nowrap px-4 py-4 text-xs text-charcoal-600">{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
          <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[item.status]}`}>{item.status.replaceAll("_", " ")}</span></td>
          <td className="px-4 py-4"><button type="button" onClick={() => { setSelected(item); setNotice(""); }} className="text-xs font-semibold text-gold-800 underline underline-offset-2">Open request</button></td>
        </tr>) : <tr><td colSpan={6} className="px-4 py-16 text-center"><RotateCcw className="mx-auto h-8 w-8 text-gold-600" /><p className="mt-3 font-serif text-lg text-charcoal-900">No return requests yet</p><p className="mt-1 text-xs text-charcoal-500">Customer submissions will appear here for authorized review.</p></td></tr>}</tbody></table>
    </div>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="return-title"><section className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-gold-300 bg-ivory-50 shadow-2xl">
      <header className="flex items-start justify-between border-b border-ivory-300 p-6"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700">Return review · {selected.orderNumber}</p><h2 id="return-title" className="mt-1 font-serif text-2xl font-bold text-charcoal-900">{selected.requestType || "Return request"}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close request" className="p-1 text-charcoal-600 hover:text-charcoal-950"><X /></button></header>
      <div className="space-y-5 p-6"><div><h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Requested items</h3><ul className="mt-2 space-y-1 text-sm text-charcoal-800">{selected.requestedItems.length ? selected.requestedItems.map((item, index) => <li key={`${item.sku}-${index}`}>{item.title} × {item.quantity}{[item.size, item.color].filter(Boolean).length ? ` · ${[item.size, item.color].filter(Boolean).join(" / ")}` : ""}</li>) : <li className="text-charcoal-500">Item details unavailable</li>}</ul></div>
        <div><h3 className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Reason</h3><p className="mt-1 text-sm text-charcoal-800">{selected.reason}</p>{selected.explanation && <p className="mt-2 whitespace-pre-wrap text-sm text-charcoal-600">{selected.explanation}</p>}</div>
        <div className="text-xs text-charcoal-500">Submitted {new Date(selected.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · Current status: <strong className="text-charcoal-800">{selected.status.replaceAll("_", " ")}</strong></div>
        {(nextStatuses[selected.status] || []).length > 0 && <div className="flex flex-wrap justify-end gap-2 border-t border-ivory-200 pt-4">{nextStatuses[selected.status]!.map((next) => <button type="button" key={next.value} disabled={saving} onClick={() => void transition(selected, next.value)} className={`px-4 py-2 text-xs font-semibold disabled:opacity-50 ${next.value === "REJECTED" ? "border border-rose-300 text-rose-800 hover:bg-rose-50" : "bg-charcoal-900 text-ivory-50 hover:bg-gold-600 hover:text-charcoal-950"}`}>{saving ? "Saving…" : next.label}</button>)}</div>}
        {(selected.status === "ITEM_RECEIVED" || selected.status === "REFUND_INITIATED" || selected.status === "COMPLETED") && <p className="border border-ivory-300 bg-white p-3 text-xs text-charcoal-600">No further action is available in this review workflow. Refund processing is handled separately.</p>}
      </div>
    </section></div>}
  </div>;
}
