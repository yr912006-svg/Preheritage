"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, X, Trash2, RefreshCw, MessageSquareText } from "lucide-react";

type Inquiry = { id: string; guestName: string | null; guestEmail: string | null; guestPhone: string | null; subject: string; message: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; createdAt: string };
const labels: Record<string, string> = { OPEN: "New", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", CLOSED: "Closed" };
const statusStyle: Record<string, string> = { OPEN: "bg-gold-100 text-gold-900", IN_PROGRESS: "bg-blue-100 text-blue-900", RESOLVED: "bg-emerald-100 text-emerald-900", CLOSED: "bg-charcoal-100 text-charcoal-700" };

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/inquiries", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load inquiries.");
      setInquiries(data.inquiries || []);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to load inquiries."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => inquiries.filter((item) => {
    const matchesStatus = filter === "ALL" || (filter === "OPEN" ? item.status === "OPEN" : item.status === filter);
    const text = `${item.guestName || ""} ${item.guestEmail || ""} ${item.guestPhone || ""} ${item.subject} ${item.message}`.toLowerCase();
    return matchesStatus && text.includes(query.trim().toLowerCase());
  }), [inquiries, filter, query]);

  async function updateStatus(item: Inquiry, status: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/inquiries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Update failed.");
      setNotice("Inquiry status updated."); await load();
      setSelected((current) => current?.id === item.id ? { ...current, status: status as Inquiry["status"] } : current);
    } catch (err) { setError(err instanceof Error ? err.message : "Update failed."); }
    finally { setBusy(false); }
  }
  async function deleteInquiry(item: Inquiry) {
    if (!window.confirm(`Delete the inquiry from ${item.guestName || item.guestEmail || "this customer"}? This cannot be undone.`)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/inquiries", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Delete failed.");
      setSelected(null); setNotice("Inquiry deleted."); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Delete failed."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-700">Customer Care</p><h1 className="mt-1 font-serif text-3xl font-bold text-charcoal-900">Customer Inquiries</h1><p className="mt-1 text-sm text-charcoal-500">Review and respond to messages sent through the atelier contact form.</p></div>
      <button onClick={() => void load()} className="inline-flex items-center gap-2 border border-ivory-400 bg-ivory-50 px-4 py-2 text-xs font-semibold text-charcoal-800 hover:border-gold-500"><RefreshCw className="h-4 w-4" />Refresh</button>
    </div>
    {notice && <p role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}
    {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}
    <div className="flex flex-wrap gap-3 rounded-sm border border-ivory-300 bg-ivory-50 p-4">
      <label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, subject, or message" className="w-full border border-ivory-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gold-500" /></label>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-ivory-300 bg-white px-3 py-2 text-sm"><option value="ALL">All statuses</option><option value="OPEN">New</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select>
    </div>
    <div className="overflow-x-auto border border-ivory-300 bg-ivory-50">
      <table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-charcoal-900 text-[11px] uppercase tracking-wider text-ivory-100"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Subject & message</th><th className="px-4 py-3">Received</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
        <tbody className="divide-y divide-ivory-300">{loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-charcoal-500">Loading customer inquiries…</td></tr> : filtered.length ? filtered.map((item) => <tr key={item.id} className="hover:bg-white">
          <td className="px-4 py-4"><div className="font-semibold text-charcoal-900">{item.guestName || "Customer"}</div><div className="text-xs text-charcoal-500">{item.guestEmail}</div>{item.guestPhone && <div className="text-xs text-charcoal-500">{item.guestPhone}</div>}</td>
          <td className="max-w-[360px] px-4 py-4"><div className="font-semibold text-charcoal-800">{item.subject}</div><p className="mt-1 truncate text-xs text-charcoal-500">{item.message}</p></td><td className="whitespace-nowrap px-4 py-4 text-xs text-charcoal-600">{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
          <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle[item.status] || statusStyle.OPEN}`}>{labels[item.status] || item.status}</span></td>
          <td className="px-4 py-4"><button onClick={() => { setSelected(item); setNotice(""); }} className="text-xs font-semibold text-gold-800 underline underline-offset-2">Open inquiry</button></td>
        </tr>) : <tr><td colSpan={5} className="px-4 py-16 text-center"><MessageSquareText className="mx-auto h-8 w-8 text-gold-600" /><p className="mt-3 font-serif text-lg text-charcoal-900">{inquiries.length ? "No inquiries match your search" : "No customer inquiries yet"}</p><p className="mt-1 text-xs text-charcoal-500">New messages submitted through the contact page will appear here.</p></td></tr>}</tbody></table>
    </div>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="inquiry-title"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-gold-300 bg-ivory-50 shadow-2xl">
      <div className="flex items-start justify-between border-b border-ivory-300 p-6"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold-700">Atelier Inquiry</p><h2 id="inquiry-title" className="mt-1 font-serif text-2xl font-bold text-charcoal-900">{selected.subject}</h2></div><button onClick={() => setSelected(null)} aria-label="Close inquiry" className="p-1 text-charcoal-600 hover:text-charcoal-950"><X /></button></div>
      <div className="space-y-5 p-6"><div className="grid gap-3 text-sm sm:grid-cols-2"><div><span className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Customer</span>{selected.guestName || "Customer"}</div><div><span className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Email</span>{selected.guestEmail || "—"}</div><div><span className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Phone</span>{selected.guestPhone || "—"}</div><div><span className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Received</span>{new Date(selected.createdAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}</div></div>
        <div className="border-t border-ivory-300 pt-4"><span className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Full message</span><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-charcoal-800">{selected.message}</p></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ivory-300 pt-4"><label className="flex items-center gap-2 text-xs font-semibold text-charcoal-700">Status<select disabled={busy} value={selected.status === "CLOSED" ? "RESOLVED" : selected.status} onChange={(e) => void updateStatus(selected, e.target.value)} className="border border-ivory-400 bg-white px-3 py-2"><option value="OPEN">New</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option></select></label><button disabled={busy} onClick={() => void deleteInquiry(selected)} className="inline-flex items-center gap-2 border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-4 w-4" />Delete inquiry</button></div>
      </div>
    </div></div>}
  </div>;
}
