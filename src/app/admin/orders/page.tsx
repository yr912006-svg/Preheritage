"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  date: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  courier?: string;
  trackingId?: string;
  trackingUrl?: string;
  items: string[];
}

const statuses = ["ALL", "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const response = await fetch("/api/admin/orders");
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Could not load orders.");
    setOrders(data.orders);
  };

  useEffect(() => { void reload().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load orders.")).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => orders.filter((order) => {
    if (selectedStatus !== "ALL" && order.status !== selectedStatus) return false;
    const q = search.trim().toLowerCase();
    return !q || [order.orderNumber, order.customerName, order.phone, order.trackingId || ""].some((value) => value.toLowerCase().includes(q));
  }), [orders, search, selectedStatus]);

  const updateOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingOrder) return;
    setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: editingOrder.id, status: form.get("status"), courierPartner: form.get("courierPartner"), trackingId: form.get("trackingId") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Order could not be updated.");
      setEditingOrder(null);
      await reload();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Order could not be updated."); }
    finally { setSaving(false); }
  };

  const exportCsv = () => {
    const columns = ["orderNumber", "customerName", "email", "phone", "city", "state", "date", "amount", "paymentMethod", "paymentStatus", "status", "courier", "trackingId"] as const;
    const csv = [columns.join(","), ...filtered.map((order) => columns.map((key) => `"${String(order[key] || "").replaceAll('"', '""')}"`).join(","))].join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = "preheritage-orders.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h1 className="font-serif text-3xl font-bold text-charcoal-900">Order Fulfillment & Logistics</h1><p className="mt-1 text-xs font-light text-charcoal-100">Real orders, status updates, and tracking details</p></div><button type="button" onClick={exportCsv} className="flex items-center gap-2 rounded border border-ivory-300 bg-ivory-50 px-4 py-2 text-xs font-semibold text-charcoal-800 hover:bg-ivory-200"><Download className="h-4 w-4" />Export filtered orders</button></div>
    {error && <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
    <div className="flex flex-col items-center justify-between gap-4 rounded-sm border border-ivory-300 bg-ivory-50 p-4 md:flex-row"><div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-100" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, patron, or tracking ID" className="w-full rounded border border-ivory-300 bg-white py-2 pl-9 pr-3 text-xs focus:border-gold-500 focus:outline-none" /></div><div className="flex w-full gap-2 overflow-x-auto text-xs md:w-auto">{statuses.map((status) => <button key={status} type="button" onClick={() => setSelectedStatus(status)} className={`whitespace-nowrap rounded px-3 py-1.5 text-[10px] font-semibold uppercase ${selectedStatus === status ? "bg-charcoal-900 text-ivory-50" : "border border-ivory-300 bg-white text-charcoal-800"}`}>{status.replaceAll("_", " ")}</button>)}</div></div>
    <div className="overflow-hidden rounded-sm border border-ivory-300 bg-ivory-50 shadow-sm"><div className="overflow-x-auto text-xs"><table className="w-full divide-y divide-ivory-300 text-left"><thead className="bg-ivory-100 text-[10px] uppercase tracking-wider text-charcoal-400"><tr>{["Order", "Patron & destination", "Items", "Amount", "Payment", "Status", "Tracking", "Action"].map((heading) => <th key={heading} className="p-4">{heading}</th>)}</tr></thead><tbody className="divide-y divide-ivory-200 text-charcoal-800">{filtered.map((order) => <tr key={order.id} className="hover:bg-ivory-100/60"><td className="p-4 font-mono font-bold text-charcoal-900">{order.orderNumber}<span className="mt-1 block font-sans text-[10px] font-normal text-charcoal-400">{order.date}</span></td><td className="p-4"><span className="block font-semibold text-charcoal-900">{order.customerName}</span><span className="block text-[10px] text-charcoal-400">{order.email}</span><span className="block text-[10px] text-charcoal-400">{order.city}, {order.state} · {order.phone}</span></td><td className="p-4">{order.items.map((item) => <div key={item} className="line-clamp-1 font-serif">{item}</div>)}</td><td className="p-4 font-serif text-sm font-bold">{formatPrice(order.amount)}</td><td className="p-4"><span className="block">{order.paymentMethod}</span><span className="text-[10px] text-charcoal-400">{order.paymentStatus}</span></td><td className="p-4"><span className="rounded bg-gold-100 px-2 py-1 text-[10px] font-bold uppercase">{order.status.replaceAll("_", " ")}</span></td><td className="p-4 font-mono text-[10px]">{order.trackingId ? <><span className="block font-sans text-charcoal-700">{order.courier}</span>{order.trackingUrl ? <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-gold-800 underline">{order.trackingId}</a> : order.trackingId}</> : <span className="italic text-charcoal-300">Not dispatched</span>}</td><td className="p-4"><button type="button" onClick={() => setEditingOrder(order)} className="rounded bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-600">Update</button></td></tr>)}</tbody></table></div>{loading && <p className="p-6 text-center text-xs text-charcoal-400">Loading orders…</p>}{!loading && filtered.length === 0 && <p className="p-8 text-center text-sm text-charcoal-400">No orders match this view.</p>}</div>
    {editingOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/60 p-4"><form onSubmit={updateOrder} className="w-full max-w-md space-y-4 rounded-sm border border-ivory-300 bg-ivory-50 p-6 shadow-2xl"><div><h2 className="font-serif text-xl font-bold text-charcoal-900">Update {editingOrder.orderNumber}</h2><p className="mt-1 text-xs text-charcoal-400">{editingOrder.customerName} · {formatPrice(editingOrder.amount)}</p></div><label className="block text-xs font-semibold text-charcoal-600">Order status<select name="status" defaultValue={editingOrder.status} className="mt-1 w-full rounded border border-ivory-300 bg-white p-2.5">{statuses.slice(1).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label><label className="block text-xs font-semibold text-charcoal-600">Courier partner<input name="courierPartner" defaultValue={editingOrder.courier || ""} maxLength={120} className="mt-1 w-full rounded border border-ivory-300 bg-white p-2.5" /></label><label className="block text-xs font-semibold text-charcoal-600">Tracking ID<input name="trackingId" defaultValue={editingOrder.trackingId || ""} maxLength={160} className="mt-1 w-full rounded border border-ivory-300 bg-white p-2.5 font-mono" /></label><div className="flex justify-end gap-2 border-t border-ivory-200 pt-3"><button type="button" onClick={() => setEditingOrder(null)} className="rounded bg-ivory-200 px-4 py-2 font-semibold text-charcoal-900">Cancel</button><button disabled={saving} className="rounded bg-charcoal-900 px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save update"}</button></div></form></div>}
  </div>;
}
