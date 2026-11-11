"use client";

import React, { useState } from "react";
import {
  Truck,
  ShieldCheck,
  Zap,
  Package,
  Gift,
  RotateCcw,
  Info,
  Calculator,
  IndianRupee,
} from "lucide-react";
import { calculateShippingCharge, calculateCheckoutTotal } from "@/lib/cart-model";

export default function ShippingRulesDashboard() {
  const [testSubtotal, setTestSubtotal] = useState<number>(3500);
  const [testDeliveryMethod, setTestDeliveryMethod] = useState<"standard" | "express">("standard");
  const [testCod, setTestCod] = useState<boolean>(false);
  const [testGiftWrap, setTestGiftWrap] = useState<boolean>(false);

  const calculatedShipping = calculateShippingCharge(testSubtotal, testDeliveryMethod);
  const codFee = testCod ? 150 : 0;
  const giftWrapCharge = testGiftWrap ? 199 : 0;
  const calculatedTotal = calculateCheckoutTotal({
    subtotal: testSubtotal,
    shippingCharge: calculatedShipping,
    codFee,
    giftWrapCharge,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">Shipping & Logistics Rules</h1>
        <p className="mt-1 text-xs text-charcoal-500">
          Operational delivery rates, free shipping thresholds, COD handling, and courier dispatch policies
        </p>
      </div>

      {/* Code Enforcement Notice */}
      <div className="p-4 bg-gold-50/60 border border-gold-200 rounded text-xs text-charcoal-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-gold-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-charcoal-900">Deterministic Transactional Pricing Enforcement</p>
          <p className="text-charcoal-600 leading-relaxed">
            PREHERITAGE enforces shipping charges, thresholds, and handling fees via server-validated deterministic models (
            <code className="px-1 py-0.5 bg-gold-100/70 rounded text-[11px] font-mono text-charcoal-800">
              src/lib/cart-model.ts
            </code>
            ). Calculations are mathematically validated during checkout and payment initiation to ensure strict price
            integrity and prevent client-side fee manipulation.
          </p>
        </div>
      </div>

      {/* Active Shipping Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Standard Delivery */}
        <div className="bg-ivory-50 border border-ivory-300 rounded p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded bg-gold-100 text-gold-900 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Active Storefront
            </span>
          </div>

          <div>
            <h2 className="font-serif font-bold text-base text-charcoal-900">Standard Domestic Delivery</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">Surface / Air transit across 27,000+ Indian pincodes</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-ivory-200 text-xs">
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Base Shipping Charge:</span>
              <span className="font-bold text-charcoal-900 font-mono">₹250</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Free Shipping Threshold:</span>
              <span className="font-bold text-emerald-700 font-mono">₹4,999</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Complimentary Tier:</span>
              <span className="text-emerald-700 font-medium">Free for orders ≥ ₹4,999</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal-600">Estimated Timeline:</span>
              <span className="text-charcoal-900 font-medium">5 – 7 business days</span>
            </div>
          </div>
        </div>

        {/* Express Priority Delivery */}
        <div className="bg-ivory-50 border border-ivory-300 rounded p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded bg-blue-100 text-blue-900 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Priority Dispatch
            </span>
          </div>

          <div>
            <h2 className="font-serif font-bold text-base text-charcoal-900">Express Priority Courier</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">Expedited air cargo dispatch for urgent heritage attire</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-ivory-200 text-xs">
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Flat Rate Charge:</span>
              <span className="font-bold text-charcoal-900 font-mono">₹499</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Free Shipping Waiver:</span>
              <span className="text-charcoal-500">Not waived by ₹4,999 threshold</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Handling Priority:</span>
              <span className="text-blue-700 font-medium">Same-day atelier packing</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal-600">Estimated Timeline:</span>
              <span className="text-charcoal-900 font-medium">2 – 3 business days</span>
            </div>
          </div>
        </div>

        {/* Cash on Delivery & Special Options */}
        <div className="bg-ivory-50 border border-ivory-300 rounded p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded bg-amber-100 text-amber-900 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Payment Fee
            </span>
          </div>

          <div>
            <h2 className="font-serif font-bold text-base text-charcoal-900">Cash on Delivery (COD)</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">Carrier cash collection and reconciliation surcharge</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-ivory-200 text-xs">
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Convenience Fee:</span>
              <span className="font-bold text-charcoal-900 font-mono">₹150</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Verification Requirement:</span>
              <span className="text-amber-800 font-medium">SMS/WhatsApp order confirmation</span>
            </div>
            <div className="flex justify-between py-1 border-b border-ivory-100">
              <span className="text-charcoal-600">Heritage Gift Packaging:</span>
              <span className="font-bold text-charcoal-900 font-mono">₹199 / order</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-charcoal-600">Return Window:</span>
              <span className="text-charcoal-900 font-medium">7 days from delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Shipping Simulator */}
      <div className="bg-ivory-50 border border-ivory-300 rounded p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gold-700" />
          <h2 className="font-serif font-bold text-lg text-charcoal-900">Interactive Shipping Rate Simulator</h2>
        </div>
        <p className="text-xs text-charcoal-600">
          Verify real-time shipping charge and total calculations using the production checkout algorithm.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded border border-ivory-200 text-xs">
          <div>
            <label className="block text-charcoal-700 font-semibold mb-1">Simulated Cart Subtotal (₹)</label>
            <div className="relative">
              <IndianRupee className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={0}
                step={100}
                value={testSubtotal}
                onChange={(e) => setTestSubtotal(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-8 pr-3 py-2 bg-ivory-50 border border-ivory-300 rounded text-xs font-mono text-charcoal-900 focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-charcoal-700 font-semibold mb-1">Delivery Method</label>
            <select
              value={testDeliveryMethod}
              onChange={(e) => setTestDeliveryMethod(e.target.value as "standard" | "express")}
              className="w-full px-3 py-2 bg-ivory-50 border border-ivory-300 rounded text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
            >
              <option value="standard">Standard Delivery (Base ₹250, Free at ₹4,999)</option>
              <option value="express">Express Courier (Flat ₹499)</option>
            </select>
          </div>

          <div>
            <label className="block text-charcoal-700 font-semibold mb-1">Payment Method</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="paymentOption"
                  checked={!testCod}
                  onChange={() => setTestCod(false)}
                  className="text-gold-600"
                />
                <span className="text-charcoal-800">Prepaid (Razorpay)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="paymentOption"
                  checked={testCod}
                  onChange={() => setTestCod(true)}
                  className="text-gold-600"
                />
                <span className="text-charcoal-800">COD (+₹150)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-charcoal-700 font-semibold mb-1">Add-ons</label>
            <label className="flex items-center gap-1.5 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={testGiftWrap}
                onChange={(e) => setTestGiftWrap(e.target.checked)}
                className="rounded text-gold-600"
              />
              <span className="text-charcoal-800">Gift Wrap (+₹199)</span>
            </label>
          </div>
        </div>

        {/* Simulator Calculation Breakdown */}
        <div className="bg-ivory-100/70 p-4 rounded border border-ivory-300 space-y-2 text-xs">
          <div className="flex justify-between text-charcoal-600">
            <span>Subtotal:</span>
            <span className="font-mono text-charcoal-900">₹{testSubtotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-charcoal-600">
            <span>
              Shipping Fee ({testDeliveryMethod === "standard" ? "Standard" : "Express Priority"}):
            </span>
            <span className="font-mono font-bold text-charcoal-900">
              {calculatedShipping === 0 ? (
                <span className="text-emerald-700">FREE (Subtotal ≥ ₹4,999)</span>
              ) : (
                `₹${calculatedShipping}`
              )}
            </span>
          </div>
          {testCod && (
            <div className="flex justify-between text-charcoal-600">
              <span>COD Convenience Fee:</span>
              <span className="font-mono text-charcoal-900">₹{codFee}</span>
            </div>
          )}
          {testGiftWrap && (
            <div className="flex justify-between text-charcoal-600">
              <span>Atelier Gift Wrapping:</span>
              <span className="font-mono text-charcoal-900">₹{giftWrapCharge}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-ivory-300 font-bold text-sm text-charcoal-900">
            <span>Final Estimated Total:</span>
            <span className="font-mono text-gold-800">₹{calculatedTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Packaging & Carrier Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        <div className="bg-ivory-50 border border-ivory-300 rounded p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-700" />
            <h3 className="font-serif font-bold text-sm text-charcoal-900">Logistics & Carrier Network</h3>
          </div>
          <p className="text-charcoal-600 leading-relaxed">
            PREHERITAGE connects with premier national freight carriers via Shiprocket automation. Every parcel is
            barcoded, tracked end-to-end, and insured for transit damage.
          </p>
          <ul className="list-disc list-inside text-charcoal-600 space-y-1">
            <li>Integrated couriers: BlueDart Express, Delhivery Air, DTDC, and India Post EMS.</li>
            <li>Automated Air Waybill (AWB) generation upon admin order dispatch.</li>
            <li>Customer SMS/WhatsApp dispatch notification with real-time tracking hyperlink.</li>
          </ul>
        </div>

        <div className="bg-ivory-50 border border-ivory-300 rounded p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-gold-700" />
            <h3 className="font-serif font-bold text-sm text-charcoal-900">Preservation Packaging Standard</h3>
          </div>
          <p className="text-charcoal-600 leading-relaxed">
            Every handloom saree, pashmina shawl, and silk kurta is wrapped in acid-free tissue paper to protect pure zari
            motifs from atmospheric oxidation.
          </p>
          <ul className="list-disc list-inside text-charcoal-600 space-y-1">
            <li>Custom rigid royal navy & gold embossed presentation boxes.</li>
            <li>Wax seal certification of authentic handcraft origin.</li>
            <li>Included cloth garment preservation bag for heirloom storage.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
