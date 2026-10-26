"use client";

import React, { useState } from "react";
import { Search, Filter, Truck, CheckCircle2, XCircle, Eye, Download, Edit } from "lucide-react";
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
  paymentStatus: "SUCCESS" | "PENDING";
  status: "PLACED" | "CONFIRMED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  courier?: string;
  trackingId?: string;
  items: string[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([
    {
      id: "ord-1",
      orderNumber: "PRE-2026-84920",
      customerName: "Pooja Sharma",
      email: "pooja.sharma@example.com",
      phone: "+91 98765 43210",
      city: "Gurugram",
      state: "Haryana",
      date: "25 Oct 2026",
      amount: 34999,
      paymentMethod: "Razorpay (UPI)",
      paymentStatus: "SUCCESS",
      status: "SHIPPED",
      courier: "Shiprocket (Air Priority)",
      trackingId: "SR-928472910IN",
      items: ["Varanasi Rangkat Kadwa Silk Saree in Antique Gold"],
    },
    {
      id: "ord-2",
      orderNumber: "PRE-2026-84919",
      customerName: "Raghavendra Singhania",
      email: "raghav@singhania.in",
      phone: "+91 99887 76655",
      city: "Mumbai",
      state: "Maharashtra",
      date: "25 Oct 2026",
      amount: 52999,
      paymentMethod: "Razorpay (Credit Card)",
      paymentStatus: "SUCCESS",
      status: "PACKED",
      items: ["Jaipur Handblock Gota Patti Lehenga Ensemble"],
    },
    {
      id: "ord-3",
      orderNumber: "PRE-2026-84918",
      customerName: "Devika Pillai",
      email: "devika.p@gmail.com",
      phone: "+91 91234 56789",
      city: "Bengaluru",
      state: "Karnataka",
      date: "24 Oct 2026",
      amount: 28999,
      paymentMethod: "Cash on Delivery",
      paymentStatus: "PENDING",
      status: "CONFIRMED",
      items: ["Kashmir Pashmina Shawl with Sozni Hand Embroidery"],
    },
    {
      id: "ord-4",
      orderNumber: "PRE-2026-84917",
      customerName: "Anya Sharma-Levy",
      email: "anya@creativeagency.ny",
      phone: "+1 212 555 0192",
      city: "New York",
      state: "NY, USA",
      date: "22 Oct 2026",
      amount: 41200,
      paymentMethod: "Stripe International",
      paymentStatus: "SUCCESS",
      status: "DELIVERED",
      courier: "DHL Express Global",
      trackingId: "DHL-98402840",
      items: ["Varanasi Kadwa Silk Saree", "Archival Poster"],
    },
  ]);

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);

  const filtered = orders.filter((o) => {
    if (selectedStatus !== "ALL" && o.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.trackingId && o.trackingId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleUpdateStatus = (newStatus: any, courierPartner?: string, trackingNumber?: string) => {
    if (!editingOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === editingOrder.id
          ? {
              ...o,
              status: newStatus,
              courier: courierPartner || o.courier || "Shiprocket Express",
              trackingId: trackingNumber || o.trackingId || `SR-${Math.floor(100000000 + Math.random() * 900000000)}IN`,
            }
          : o
      )
    );
    setEditingOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            Order Fulfillment & Logistics
          </h1>
          <p className="text-xs text-charcoal-100 font-light mt-1">
            Dispatch, tracking assignment, status updates, and courier integration
          </p>
        </div>

        <button
          onClick={() => alert("Exporting all orders to CSV...")}
          className="px-4 py-2 bg-ivory-50 border border-ivory-300 text-charcoal-800 text-xs font-semibold rounded flex items-center gap-2 hover:bg-ivory-200"
        >
          <Download className="w-4 h-4" />
          <span>Export Orders CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-ivory-50 p-4 rounded-sm border border-ivory-300 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, patron, or tracking AWB..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-ivory-300 text-xs rounded focus:outline-none focus:border-gold-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto text-xs">
          {["ALL", "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded uppercase font-semibold text-[11px] whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? "bg-charcoal-900 text-ivory-50 shadow-sm"
                  : "bg-white border border-ivory-300 text-charcoal-800 hover:border-gold-500"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-ivory-50 rounded-sm border border-ivory-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left divide-y divide-ivory-300">
            <thead className="bg-ivory-100 text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Patron & Destination</th>
                <th className="p-4">Piece Ordered</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4">Logistics / Tracking</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-charcoal-800">
              {filtered.map((ord) => (
                <tr key={ord.id} className="hover:bg-ivory-100/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-charcoal-900">{ord.orderNumber}</td>
                  <td className="p-4">
                    <span className="font-semibold block text-charcoal-900">{ord.customerName}</span>
                    <span className="text-[11px] text-charcoal-100 block">
                      {ord.city}, {ord.state} • {ord.phone}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-serif block line-clamp-1">{ord.items[0]}</span>
                    {ord.items.length > 1 && (
                      <span className="text-[10px] text-gold-700 font-semibold">
                        +{ord.items.length - 1} more pieces
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-serif font-bold text-sm text-charcoal-900">
                    {formatPrice(ord.amount)}
                  </td>
                  <td className="p-4">
                    <span className="block text-[11px]">{ord.paymentMethod}</span>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                        ord.paymentStatus === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : ord.status === "SHIPPED"
                          ? "bg-gold-100 text-gold-900"
                          : ord.status === "PACKED"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-900"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px]">
                    {ord.trackingId ? (
                      <div>
                        <span className="text-charcoal-900 block font-semibold">{ord.courier}</span>
                        <span className="text-gold-700">{ord.trackingId}</span>
                      </div>
                    ) : (
                      <span className="text-charcoal-100 italic">Not Dispatched</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingOrder(ord)}
                      className="px-3 py-1.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 rounded text-xs font-semibold"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory-50 max-w-md w-full p-6 rounded-sm border border-ivory-300 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-charcoal-900 mb-1">
              Update Order #{editingOrder.orderNumber}
            </h3>
            <p className="text-xs text-charcoal-100 mb-4">
              Patron: <strong>{editingOrder.customerName}</strong> ({formatPrice(editingOrder.amount)})
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-charcoal-400 font-semibold mb-1">Change Order Status</label>
                <select
                  id="new-order-status"
                  defaultValue={editingOrder.status}
                  className="w-full bg-white border border-ivory-300 p-2.5 rounded font-semibold text-charcoal-900"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PACKED">PACKED (In signature ivory hardbox)</option>
                  <option value="SHIPPED">SHIPPED (Handed to courier)</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-charcoal-400 font-semibold mb-1">Logistics Partner</label>
                <select
                  id="new-courier-partner"
                  defaultValue={editingOrder.courier || "Shiprocket Express Priority"}
                  className="w-full bg-white border border-ivory-300 p-2.5 rounded"
                >
                  <option value="Shiprocket Express Priority">Shiprocket Express Priority</option>
                  <option value="Delhivery Surface">Delhivery Surface</option>
                  <option value="Bluedart Air">Bluedart Air</option>
                  <option value="DHL Express Global">DHL Express Global</option>
                </select>
              </div>

              <div>
                <label className="block text-charcoal-400 font-semibold mb-1">Tracking ID / AWB Number</label>
                <input
                  type="text"
                  id="new-tracking-id"
                  defaultValue={editingOrder.trackingId || `SR-${Date.now().toString().slice(-8)}IN`}
                  className="w-full bg-white border border-ivory-300 p-2.5 rounded font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-ivory-200">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-ivory-200 text-charcoal-900 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const st = (document.getElementById("new-order-status") as HTMLSelectElement).value;
                    const cp = (document.getElementById("new-courier-partner") as HTMLSelectElement).value;
                    const tr = (document.getElementById("new-tracking-id") as HTMLInputElement).value;
                    handleUpdateStatus(st, cp, tr);
                  }}
                  className="px-5 py-2 bg-charcoal-900 text-ivory-50 rounded font-semibold hover:bg-gold-600"
                >
                  Save & Notify Patron
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
