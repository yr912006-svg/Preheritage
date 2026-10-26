"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, PackageCheck, Truck, Download, ArrowRight, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/utils";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "PRE-2026-84920";
  const paymentMethod = searchParams.get("method") || "RAZORPAY";
  const paymentId = searchParams.get("paymentId");

  return (
    <div className="bg-ivory-50 p-8 sm:p-12 rounded-sm border border-ivory-300 shadow-luxury text-center">
      {/* Royal Seal Success Badge */}
      <div className="w-20 h-20 bg-gold-100 border-2 border-gold-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
        <CheckCircle2 className="w-10 h-10 text-gold-600" />
      </div>

      <span className="text-xs uppercase tracking-[0.25em] text-gold-700 font-bold block mb-2">
        Order Confirmed With Royal Care
      </span>

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 mb-2">
        Thank You for Carrying Heritage Forward
      </h1>

      <p className="text-xs sm:text-sm text-charcoal-100 max-w-lg mx-auto mb-8 font-light leading-relaxed">
        Your handcrafted order has been received and allocated to our master artisan packing ateliers. An order confirmation invoice and tracking updates have been dispatched to your email and WhatsApp.
      </p>

      {/* Order Details Card */}
      <div className="bg-ivory-100/70 p-6 rounded border border-ivory-200 text-left mb-8 space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-200 gap-2">
          <div>
            <span className="text-charcoal-100 block">Order Reference Number</span>
            <span className="font-mono font-bold text-base text-charcoal-900">{orderId}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-charcoal-100 block">Payment Status</span>
            <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded text-[11px]">
              {paymentMethod === "COD" ? "Cash on Delivery (Pending)" : "Verified & Paid via Razorpay"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <span className="text-charcoal-100 block mb-0.5">Estimated Dispatch</span>
            <span className="font-semibold text-charcoal-900">Within 24-48 Hours</span>
          </div>
          <div>
            <span className="text-charcoal-100 block mb-0.5">Expected Delivery</span>
            <span className="font-semibold text-charcoal-900">3-5 Business Days</span>
          </div>
          <div>
            <span className="text-charcoal-100 block mb-0.5">Logistics Partner</span>
            <span className="font-semibold text-charcoal-900">Shiprocket Express</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/track-order?orderId=${encodeURIComponent(orderId)}`}
          className="w-full sm:w-auto px-8 py-3.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded transition-colors"
        >
          <Truck className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>

        <Link
          href="/shop"
          className="w-full sm:w-auto px-8 py-3.5 bg-ivory-200 hover:bg-ivory-300 text-charcoal-900 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded transition-colors"
        >
          <span>Continue Exploring</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Account Save Prompt */}
      <div className="mt-10 pt-8 border-t border-ivory-200 text-center">
        <h3 className="font-serif text-base font-semibold text-charcoal-900 mb-1">
          Want to track this order easily from your dashboard?
        </h3>
        <p className="text-xs text-charcoal-100 mb-4">
          Create a Preheritage patron account to save your address, download invoices, and access private loom releases.
        </p>
        <Link
          href="/register"
          className="text-xs text-gold-700 hover:text-gold-900 font-bold underline"
        >
          Create Account with 1-Click →
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="bg-ivory-100 min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Suspense fallback={<div className="font-serif text-lg text-charcoal-900 text-center">Loading Order Confirmation...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
