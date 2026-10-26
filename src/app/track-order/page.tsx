"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Truck, CheckCircle2, Clock, ShieldCheck, MapPin, Package } from "lucide-react";
import { ORDER_TIMELINE_STEPS, formatPrice } from "@/lib/utils";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || "";

  const [orderQuery, setOrderQuery] = useState(initialOrderId);
  const [email, setEmail] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;
    setLoading(true); setError(""); setSearchedOrder(null);
    try {
      const response = await fetch("/api/orders/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNumber: orderQuery, email }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "We could not find this order.");
      setSearchedOrder({ ...data.order, courier: data.order.courierPartner || "Awaiting dispatch", totalAmount: Number(data.order.totalAmount), items: data.order.items.map((item: any) => ({ ...item, qty: item.quantity })) });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Order lookup failed."); }
    finally { setLoading(false); }
  };

  const getStepStatus = (stepIndex: number, currentStatus: string) => {
    const statuses = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
    const currentIndex = statuses.indexOf(currentStatus);
    if (stepIndex < currentIndex) return "COMPLETED";
    if (stepIndex === currentIndex) return "CURRENT";
    return "UPCOMING";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-10">
        <span className="text-xs uppercase tracking-[0.24em] text-gold-600 font-semibold font-sans block mb-1">
          Real-Time Logistics
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 mb-2">
          Track Your Preheritage Order
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-100 font-light">
          Enter your order reference and checkout email. Signed-in customers can look up their own orders.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm mb-10 max-w-xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="Enter Order ID (e.g. PRE-2026-1001)"
              required
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-ivory-300 text-xs font-mono uppercase rounded focus:outline-none focus:border-gold-500"
            />
          </div>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Checkout email for guest orders" className="w-full rounded border border-ivory-300 bg-white px-3 py-2.5 text-xs" />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold rounded transition-colors disabled:opacity-50"
          >
            {loading ? "Searching…" : "Track"}
          </button>
        </form>
        {error && <p role="alert" className="mt-3 text-xs text-rose-700">{error}</p>}
      </div>

      {/* Track Results */}
      {searchedOrder && (
        <div className="bg-ivory-50 p-6 sm:p-10 rounded-sm border border-ivory-300 shadow-luxury space-y-8">
          {/* Order Header Summary */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-ivory-200 gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-charcoal-100 block">
                Order Reference Number
              </span>
              <span className="font-mono text-xl font-bold text-charcoal-900">
                {searchedOrder.orderNumber}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-charcoal-100 block">
                Carrier & Tracking ID
              </span>
              <span className="font-semibold text-charcoal-900 text-sm block">
                {searchedOrder.courier}
              </span>
              <span className="font-mono text-xs text-gold-700">
                AWB: {searchedOrder.trackingId}
              </span>
            </div>
          </div>

          {/* 6-Stage Timeline */}
          <div>
            <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-6">
              Shipment Progress
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ivory-300">
              {ORDER_TIMELINE_STEPS.map((step, idx) => {
                const state = getStepStatus(idx, searchedOrder.status);
                return (
                  <div key={step.status} className="relative">
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        state === "COMPLETED"
                          ? "bg-gold-600 border-gold-600 text-white"
                          : state === "CURRENT"
                          ? "bg-white border-gold-600 text-gold-600 ring-4 ring-gold-100"
                          : "bg-ivory-200 border-ivory-300 text-transparent"
                      }`}
                    >
                      {state === "COMPLETED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {state === "CURRENT" && <div className="w-2 h-2 rounded-full bg-gold-600" />}
                    </div>

                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-sm ${
                            state === "UPCOMING" ? "text-charcoal-100" : "text-charcoal-900"
                          }`}
                        >
                          {step.label}
                        </span>
                        {state === "CURRENT" && (
                          <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] uppercase font-bold rounded">
                            Current Status
                          </span>
                        )}
                      </div>
                      <p className="text-charcoal-100 mt-0.5 font-light">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enclosed Items */}
          <div className="pt-6 border-t border-ivory-200">
            <h4 className="font-serif text-base font-bold text-charcoal-900 mb-3">
              Items in This Shipment
            </h4>
            <div className="space-y-2 text-xs text-charcoal-200">
              {searchedOrder.items.map((it: any, i: number) => (
                <div key={i} className="flex justify-between p-3 bg-ivory-100 rounded border border-ivory-200">
                  <div>
                    <span className="font-semibold text-charcoal-900">{it.title}</span>
                    <div className="text-[11px] text-charcoal-100">
                      Size: {it.size} • Color: {it.color} • Qty: {it.qty}
                    </div>
                  </div>
                  <span className="font-bold text-charcoal-900">{formatPrice(searchedOrder.totalAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-12">
      <Suspense fallback={<div className="font-serif text-lg text-charcoal-900 text-center">Loading Logistics Tracker...</div>}>
        <TrackOrderContent />
      </Suspense>
    </div>
  );
}
