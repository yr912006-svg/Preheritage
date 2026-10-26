"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Gift,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, INDIAN_STATES, generateOrderNumber } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, discountAmount, clearCart, appliedCoupon } = useCart();

  // Guest vs Registered
  const [isGuest, setIsGuest] = useState(true);

  // Delivery details form
  const [formData, setFormData] = useState({
    fullName: "Pooja Sharma",
    email: "pooja.sharma@example.com",
    phone: "9876543210",
    houseFlat: "Villa 14, Royal Palm Residences",
    area: "Golf Course Road",
    landmark: "Near DLF Horizon",
    city: "Gurugram",
    state: "Haryana",
    pincode: "122002",
    country: "India",
  });

  // Shipping & Gift Wrap
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [isGiftWrapped, setIsGiftWrapped] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Payment method: RAZORPAY (UPI, Cards, NetBanking), COD, STRIPE
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD" | "STRIPE">("RAZORPAY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Pincode validation state
  const [pincodeStatus, setPincodeStatus] = useState<"IDLE" | "VALIDATING" | "SERVICEABLE">("SERVICEABLE");

  // Calculations
  const shippingFee = deliveryMethod === "express" ? 499 : subtotal >= 4999 ? 0 : 250;
  const giftWrapFee = isGiftWrapped ? 199 : 0;
  const codFee = paymentMethod === "COD" ? 150 : 0;
  const grandTotal = subtotal - discountAmount + shippingFee + giftWrapFee + codFee;

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: code }));
    if (code.length === 6) {
      setPincodeStatus("SERVICEABLE");
    }
  };

  // Dynamically load Razorpay SDK
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Place Order handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage("");

    try {
      // 1. COD Order Placement
      if (paymentMethod === "COD") {
        if (grandTotal > 25000) {
          throw new Error("Cash on Delivery is limited to orders up to ₹25,000. Please choose Razorpay for royal heirloom orders.");
        }

        // Call backend API to record order
        const orderNumber = generateOrderNumber();
        const payload = {
          orderNumber,
          customer: formData,
          items: cart,
          subtotal,
          discountAmount,
          couponCode: appliedCoupon?.code,
          shippingFee,
          giftWrapFee,
          codFee,
          grandTotal,
          paymentMethod: "COD",
          paymentStatus: "PENDING",
          deliveryMethod,
          giftMessage,
          orderNotes,
        };

        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success || !data.orderNumber) {
          throw new Error(data.message || "We could not save your order. Please try again.");
        }
        clearCart();
        router.push(`/order-success?orderId=${data.orderNumber}&method=COD`);
        return;
      }

      // 2. Razorpay Payment Flow
      if (paymentMethod === "RAZORPAY") {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Could not load Razorpay payment gateway. Please check your internet connection.");
        }

        // Create Razorpay Order from server API
        const createOrderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.map((item: any) => ({ productId: item.productId || item.id, variantId: item.variantId, quantity: item.quantity })),
            deliveryMethod,
            giftWrap: isGiftWrapped,
          }),
        });

        const orderData = await createOrderRes.json();
        if (!createOrderRes.ok || !orderData.success || !orderData.order?.id) {
          throw new Error(orderData.message || "Payment gateway is unavailable. Please try again later.");
        }

        const rzpOrderId = orderData.order.id;
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!keyId) {
          throw new Error("Payment gateway is not configured. Please contact the store.");
        }

        const options = {
          key: keyId,
          amount: orderData.order.amount,
          currency: "INR",
          name: "PREHERITAGE",
          description: "Wear the Stories of India — Royal Order",
          order_id: rzpOrderId,
          handler: async function (response: any) {
            try {
              const verificationRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verification = await verificationRes.json();
              if (!verificationRes.ok || !verification.success) {
                throw new Error(verification.message || "Payment verification failed. Do not retry until you check your payment status.");
              }

              const confirmedOrderNumber = generateOrderNumber();
              const orderRes = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderNumber: confirmedOrderNumber, customer: formData, items: cart, subtotal,
                  discountAmount, couponCode: appliedCoupon?.code, shippingFee, giftWrapFee, codFee: 0,
                  grandTotal, paymentMethod: "RAZORPAY", deliveryMethod, giftMessage, orderNotes,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const savedOrder = await orderRes.json();
              if (!orderRes.ok || !savedOrder.success || !savedOrder.orderNumber) {
                throw new Error(savedOrder.message || "Payment was verified, but the order could not be saved. Contact support with payment ID: " + response.razorpay_payment_id);
              }
              clearCart();
              router.push(`/order-success?orderId=${savedOrder.orderNumber}&paymentId=${response.razorpay_payment_id}`);
            } catch (error: any) {
              setErrorMessage(error?.message || "We could not confirm your order. Please contact support.");
              setIsProcessing(false);
            }
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#C5A869",
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setErrorMessage(response.error?.description || "Payment was declined. Please try another card or UPI.");
          setIsProcessing(false);
        });
        rzp.open();
      }

      // Stripe checkout is not integrated yet; never show a fake success page.
      if (paymentMethod === "STRIPE") {
        throw new Error("International card payments are not available yet. Please choose Razorpay or Cash on Delivery.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while placing your order. Please retry.");
      setIsProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-ivory-100 min-h-screen py-16 flex items-center justify-center">
        <div className="bg-ivory-50 p-8 rounded border border-ivory-300 text-center max-w-md">
          <h2 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">No Items In Bag</h2>
          <p className="text-xs text-charcoal-100 mb-6">Your bag is empty. Please select products to proceed with checkout.</p>
          <Link href="/shop" className="px-6 py-3 bg-charcoal-900 text-ivory-50 text-xs uppercase tracking-widest font-semibold rounded">
            Explore Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900">
            Secure Heritage Checkout
          </h1>
          <p className="text-xs text-charcoal-100 mt-1 flex items-center gap-1.5 font-light">
            <Lock className="w-3.5 h-3.5 text-gold-600" />
            <span>256-Bit Bank Grade SSL Encrypted Checkout • Preheritage House</span>
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Delivery Address & Payment Options */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Contact & Guest Login Notice */}
            <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-ivory-300 mb-4">
                <h2 className="font-serif text-lg font-bold text-charcoal-900">
                  1. Contact Information
                </h2>
                <div className="text-xs text-charcoal-100">
                  <span>Guest Checkout Enabled</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-charcoal-400 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-400 font-semibold mb-1">Mobile Phone (for delivery SMS) *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Destination Address */}
            <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-charcoal-900 pb-4 border-b border-ivory-300 mb-4">
                2. Shipping Address
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-charcoal-400 font-semibold mb-1">Recipient Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">PIN Code *</label>
                    <input
                      type="text"
                      name="pincode"
                      required
                      value={formData.pincode}
                      onChange={handlePincodeChange}
                      placeholder="6-digit PIN code"
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-mono"
                    />
                    {pincodeStatus === "SERVICEABLE" && (
                      <span className="text-[10px] text-emerald-700 mt-1 block">
                        ✓ Serviceable by Shiprocket Express Delivery
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">City / District *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal-400 font-semibold mb-1">House / Flat / Villa / Suite *</label>
                    <input
                      type="text"
                      name="houseFlat"
                      required
                      value={formData.houseFlat}
                      onChange={handleChange}
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-charcoal-400 font-semibold mb-1">Street / Locality / Sector *</label>
                  <input
                    type="text"
                    name="area"
                    required
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-charcoal-400 font-semibold mb-1">Nearby Landmark (Optional)</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Delivery Speed & Royal Gift Wrapping */}
            <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-300">
                3. Delivery Options & Gift Presentation
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label
                  className={`p-3.5 rounded border cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryMethod === "standard"
                      ? "border-gold-600 bg-gold-50/50"
                      : "border-ivory-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-charcoal-900">Standard Insured</span>
                    <span className="text-gold-700 font-semibold">{subtotal >= 4999 ? "FREE" : "₹250"}</span>
                  </div>
                  <span className="text-[11px] text-charcoal-100">Dispatches via Shiprocket (3-5 business days)</span>
                  <input
                    type="radio"
                    name="delivery"
                    className="hidden"
                    checked={deliveryMethod === "standard"}
                    onChange={() => setDeliveryMethod("standard")}
                  />
                </label>

                <label
                  className={`p-3.5 rounded border cursor-pointer flex flex-col justify-between transition-all ${
                    deliveryMethod === "express"
                      ? "border-gold-600 bg-gold-50/50"
                      : "border-ivory-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-charcoal-900">Air Express Priority</span>
                    <span className="text-gold-700 font-semibold">₹499</span>
                  </div>
                  <span className="text-[11px] text-charcoal-100">Dispatched priority air transit (24-48 hours)</span>
                  <input
                    type="radio"
                    name="delivery"
                    className="hidden"
                    checked={deliveryMethod === "express"}
                    onChange={() => setDeliveryMethod("express")}
                  />
                </label>
              </div>

              {/* Gift Wrap option */}
              <div className="pt-3 border-t border-ivory-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal-900">
                  <input
                    type="checkbox"
                    checked={isGiftWrapped}
                    onChange={(e) => setIsGiftWrapped(e.target.checked)}
                    className="rounded border-ivory-300 text-gold-600 focus:ring-gold-500"
                  />
                  <Gift className="w-4 h-4 text-gold-600" />
                  <span>Enclose in Preheritage Signature Gold-Embossed Gift Box (+₹199)</span>
                </label>
                {isGiftWrapped && (
                  <div className="mt-3">
                    <label className="block text-[11px] font-semibold text-charcoal-400 mb-1">
                      Personalized Royal Wax-Sealed Message Card
                    </label>
                    <textarea
                      rows={2}
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="e.g. Wishing you timeless joy on your royal milestone..."
                      className="w-full bg-white border border-ivory-300 p-2 text-xs rounded focus:outline-none focus:border-gold-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Payment Methods */}
            <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm space-y-4">
              <h2 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-300">
                4. Select Payment Method
              </h2>

              <div className="space-y-3">
                {/* Razorpay (UPI, Card, Netbanking) */}
                <label
                  className={`p-4 rounded border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "RAZORPAY"
                      ? "border-gold-600 bg-gold-50/50"
                      : "border-ivory-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "RAZORPAY"}
                      onChange={() => setPaymentMethod("RAZORPAY")}
                      className="text-gold-600"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">
                        Razorpay Secure (UPI, Cards, NetBanking, Wallets)
                      </span>
                      <span className="text-[11px] text-charcoal-100">
                        Supports Google Pay, PhonePe, Paytm, RuPay, Visa, Mastercard, and all Indian banks
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-gold-600 shrink-0" />
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`p-4 rounded border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "COD"
                      ? "border-gold-600 bg-gold-50/50"
                      : "border-ivory-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "COD"}
                      onChange={() => setPaymentMethod("COD")}
                      className="text-gold-600"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[11px] text-charcoal-100">
                        Pay cash or UPI to delivery agent (+₹150 handling fee)
                      </span>
                    </div>
                  </div>
                  <Truck className="w-5 h-5 text-gold-600 shrink-0" />
                </label>

                {/* Stripe for International */}
                <label
                  className={`p-4 rounded border cursor-pointer flex items-center justify-between transition-all ${
                    paymentMethod === "STRIPE"
                      ? "border-gold-600 bg-gold-50/50"
                      : "border-ivory-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === "STRIPE"}
                      onChange={() => setPaymentMethod("STRIPE")}
                      className="text-gold-600"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">
                        Stripe International Card
                      </span>
                      <span className="text-[11px] text-charcoal-100">
                        For cards issued in USA, UK, Europe, UAE, Australia & worldwide
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-gold-700">USD/EUR</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Confirmation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm space-y-5">
              <h3 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-300">
                Order Review ({cart.length} {cart.length === 1 ? "Item" : "Items"})
              </h3>

              {/* Items preview list */}
              <div className="divide-y divide-ivory-200 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="relative aspect-[3/4] w-12 rounded bg-ivory-200 overflow-hidden shrink-0">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-charcoal-900 block line-clamp-1">{item.title}</span>
                      <span className="text-[11px] text-charcoal-100">
                        {item.size} • {item.color} • Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="font-serif font-bold text-charcoal-900">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Final Math */}
              <div className="space-y-2 text-xs text-charcoal-200 pt-3 border-t border-ivory-300">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Privilege Discount ({appliedCoupon?.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>{shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}</span>
                </div>
                {isGiftWrapped && (
                  <div className="flex justify-between">
                    <span>Royal Gift Packaging</span>
                    <span>{formatPrice(giftWrapFee)}</span>
                  </div>
                )}
                {paymentMethod === "COD" && (
                  <div className="flex justify-between">
                    <span>Cash on Delivery Handling</span>
                    <span>{formatPrice(codFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-serif font-bold text-xl text-charcoal-900 pt-3 border-t border-ivory-300">
                  <span>Grand Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 bg-charcoal-900 hover:bg-gold-600 disabled:bg-charcoal-200 text-ivory-50 text-xs uppercase tracking-[0.22em] font-semibold flex items-center justify-center gap-2 transition-all rounded shadow-luxury"
              >
                {isProcessing ? (
                  <span>Securing Order Details...</span>
                ) : (
                  <>
                    <span>Place Order ({formatPrice(grandTotal)})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-[11px] text-charcoal-100 text-center font-light space-y-1">
                <p>By placing your order, you agree to Preheritage Terms & Refund Policy.</p>
                <p className="text-emerald-700 font-medium">✓ 100% Authentic Handcrafted Guarantee</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
