"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { ProductImage } from "@/components/shop/ProductImage";
import { calculateCheckoutTotal, calculateShippingCharge } from "@/lib/cart-model";
import { formatPrice, INDIAN_STATES, generateOrderNumber } from "@/lib/utils";
import { selectCheckoutAddress } from "@/lib/address-management";

type CheckoutPriceQuote = {
  items: Array<{ productId: string; variantId: string | null; title: string; quantity: number; price: number }>;
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  giftWrapCharge: number;
  codFee: number;
  totalAmount: number;
};

function isCheckoutPriceQuote(value: unknown): value is CheckoutPriceQuote {
  if (!value || typeof value !== "object") return false;
  const quote = value as Partial<CheckoutPriceQuote>;
  return Array.isArray(quote.items) && quote.items.every((item) => item && typeof item.productId === "string" &&
    (typeof item.variantId === "string" || item.variantId === null) && typeof item.title === "string" &&
    Number.isInteger(item.quantity) && typeof item.price === "number" && Number.isFinite(item.price)) &&
    [quote.subtotal, quote.discountAmount, quote.shippingCharge, quote.giftWrapCharge, quote.codFee, quote.totalAmount]
      .every((amount) => typeof amount === "number" && Number.isFinite(amount));
}

function localCheckoutDraftTag(value: string) {
  // This browser-only tag selects a retry key; the server independently binds
  // that key to its SHA-256 request fingerprint and customer identity.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, discountAmount, clearCart, appliedCoupon } = useCart();
  const validCart = cart.length > 0 && cart.every((item) => Number.isInteger(item.quantity) && item.quantity > 0 && Number.isFinite(item.price) && item.price > 0 && Number.isInteger(item.maxStock) && item.maxStock >= item.quantity);

  // Delivery details form
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    houseFlat: "",
    area: "",
    landmark: "",
    city: "",
    state: INDIAN_STATES[0] || "Delhi",
    pincode: "",
    country: "India",
  });
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const applySavedAddress = (address: any) => {
    setFormData((current) => ({
      ...current,
      fullName: address.fullName ?? current.fullName,
      phone: address.phone ?? current.phone,
      houseFlat: address.houseFlat ?? current.houseFlat,
      area: address.area ?? current.area,
      landmark: address.landmark ?? "",
      city: address.city ?? current.city,
      state: address.state ?? current.state,
      pincode: address.pincode ?? current.pincode,
      country: address.country ?? current.country,
    }));
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetch("/api/account/profile"), fetch("/api/account/addresses")]).then(async ([profileResponse, addressResponse]) => {
      if (!active) return;
      const [profileData, addressData] = await Promise.all([profileResponse.json(), addressResponse.json()]);
      const profile = profileData.profile;
      const addresses = Array.isArray(addressData.addresses) ? addressData.addresses : [];
      setSavedAddresses(addresses);
      const address = selectCheckoutAddress(addresses);
      setSelectedAddressId(address?.id ?? "");
      if (!profile && !address) return;
      setFormData((current) => ({
        ...current,
        fullName: address?.fullName ?? profile?.name ?? current.fullName,
        email: profile?.email ?? current.email,
        phone: address?.phone ?? profile?.phone ?? current.phone,
        houseFlat: address?.houseFlat ?? current.houseFlat,
        area: address?.area ?? current.area,
        landmark: address?.landmark ?? current.landmark,
        city: address?.city ?? current.city,
        state: address?.state ?? current.state,
        pincode: address?.pincode ?? current.pincode,
        country: address?.country ?? current.country,
      }));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Shipping & Gift Wrap
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [isGiftWrapped, setIsGiftWrapped] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("COD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingPriceQuote, setPendingPriceQuote] = useState<{ pricing: CheckoutPriceQuote; token: string } | null>(null);
  const checkoutAttemptKey = useRef<{ key: string; draftTag: string } | null>(null);
  const checkoutDraftSignature = JSON.stringify({
    formData,
    items: cart.map((item) => ({ productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity })),
    deliveryMethod, paymentMethod, giftWrap: isGiftWrapped, couponCode: appliedCoupon?.code ?? null, giftMessage, orderNotes,
  });

  useEffect(() => {
    setPendingPriceQuote(null);
  }, [checkoutDraftSignature]);

  useEffect(() => {
    let active = true;
    void fetch("/api/payments/config", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((config) => {
      if (active) setRazorpayEnabled(config?.razorpayEnabled === true);
    }).catch(() => { if (active) setRazorpayEnabled(false); });
    return () => { active = false; };
  }, []);

  // Pincode validation state
  const [pincodeStatus, setPincodeStatus] = useState<"IDLE" | "VALID">("IDLE");

  // Calculations
  const shippingFee = appliedCoupon?.freeShipping ? 0 : calculateShippingCharge(subtotal, deliveryMethod);
  const giftWrapFee = isGiftWrapped ? 199 : 0;
  const codFee = paymentMethod === "COD" ? 150 : 0;
  const grandTotal = calculateCheckoutTotal({ subtotal, discountAmount, shippingCharge: shippingFee, giftWrapCharge: giftWrapFee, codFee });

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (["fullName", "phone", "houseFlat", "area", "landmark", "city", "state", "country"].includes(e.target.name)) setSelectedAddressId("");
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: code }));
    setSelectedAddressId("");
    setPincodeStatus(code.length === 6 ? "VALID" : "IDLE");
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
    console.log("[CHECKOUT] handlePlaceOrder called", { validCart, paymentMethod, itemsCount: cart.length });
    if (!validCart) {
      setErrorMessage("Your bag has no valid, available items. Return to the store and add an in-stock item.");
      return;
    }
    setIsProcessing(true);
    setErrorMessage("");

    try {
      // 1. COD Order Placement
      if (paymentMethod === "COD") {
        if (grandTotal > 25000) {
          throw new Error("Cash on Delivery is limited to orders up to ₹25,000. Please choose Razorpay for royal heirloom orders.");
        }

        // Call backend API to record order
        const attemptStorageKey = "preheritage:cod-checkout-attempt";
        const draftTag = localCheckoutDraftTag(checkoutDraftSignature);
        if (!checkoutAttemptKey.current || checkoutAttemptKey.current.draftTag !== draftTag) {
          let savedAttempt: { key?: unknown; draftTag?: unknown } | null = null;
          try { savedAttempt = JSON.parse(window.sessionStorage.getItem(attemptStorageKey) ?? "null"); } catch { /* proceed with an in-memory key */ }
          const savedKey = typeof savedAttempt?.key === "string" && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(savedAttempt.key)
            ? savedAttempt.key
            : null;
          const key = savedAttempt?.draftTag === draftTag && savedKey ? savedKey : window.crypto?.randomUUID?.();
          if (!key) throw new Error("Secure checkout retry protection is unavailable. Please reload and try again.");
          checkoutAttemptKey.current = { key, draftTag };
          try { window.sessionStorage.setItem(attemptStorageKey, JSON.stringify(checkoutAttemptKey.current)); } catch { /* the server still enforces keys within this page attempt */ }
        }
        const orderNumber = generateOrderNumber();
        const payload = {
          orderNumber,
          checkoutIdempotencyKey: checkoutAttemptKey.current.key,
          customer: formData,
          items: cart,
          subtotal,
          discountAmount,
          couponCode: appliedCoupon?.code,
          shippingFee,
          giftWrapFee,
          codFee,
          grandTotal,
          ...(pendingPriceQuote ? { confirmedPricingToken: pendingPriceQuote.token } : {}),
          paymentMethod: "COD",
          paymentStatus: "PENDING",
          deliveryMethod,
          giftMessage,
          orderNotes,
        };

        console.log("[CHECKOUT] COD flow sending payload with idempotencyKey:", payload.checkoutIdempotencyKey);
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        console.log("[CHECKOUT] /api/checkout HTTP status:", res.status);

        const data = await res.json();
        if (res.status === 409 && data.code === "PRICE_CHANGED") {
          if (isCheckoutPriceQuote(data.pricing) && typeof data.confirmationToken === "string") {
            setPendingPriceQuote({ pricing: data.pricing, token: data.confirmationToken });
            setErrorMessage("");
          } else {
            setPendingPriceQuote(null);
            setErrorMessage(typeof data.message === "string" ? data.message : "Prices changed while checkout was being placed. Please review the latest total.");
          }
          setIsProcessing(false);
          return;
        }
        if (!res.ok || !data.success || !data.orderNumber) {
          throw new Error(data.message || "We could not save your order. Please try again.");
        }
        checkoutAttemptKey.current = null;
        setPendingPriceQuote(null);
        try { window.sessionStorage.removeItem(attemptStorageKey); } catch { /* ignore unavailable browser storage */ }
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
                    couponCode: appliedCoupon?.code,
                    customerEmail: formData.email,
                    customer: formData,
                    giftMessage,
                    orderNotes,
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

    } catch (err: any) {
      console.error("[CHECKOUT] caught error in handlePlaceOrder:", err?.message || err);
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
          <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {pendingPriceQuote && paymentMethod === "COD" && (
          <section aria-live="polite" className="mb-6 rounded-sm border border-gold-500 bg-ivory-50 p-5 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-charcoal-900">Review updated order total</h2>
            <p className="mt-1 text-sm text-charcoal-600">Prices or charges changed since your last review. Check the updated summary below, then choose “Confirm updated total” to place your order.</p>
            <ul className="mt-4 space-y-2 text-sm text-charcoal-700">
              {pendingPriceQuote.pricing.items.map((item) => <li key={`${item.productId}:${item.variantId ?? ""}`} className="flex justify-between gap-4"><span>{item.title} × {item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></li>)}
              <li className="flex justify-between border-t border-ivory-300 pt-2"><span>Subtotal</span><span>{formatPrice(pendingPriceQuote.pricing.subtotal)}</span></li>
              {pendingPriceQuote.pricing.discountAmount > 0 && <li className="flex justify-between"><span>Discount</span><span>−{formatPrice(pendingPriceQuote.pricing.discountAmount)}</span></li>}
              <li className="flex justify-between"><span>Shipping</span><span>{pendingPriceQuote.pricing.shippingCharge === 0 ? "FREE" : formatPrice(pendingPriceQuote.pricing.shippingCharge)}</span></li>
              {pendingPriceQuote.pricing.giftWrapCharge > 0 && <li className="flex justify-between"><span>Gift wrap</span><span>{formatPrice(pendingPriceQuote.pricing.giftWrapCharge)}</span></li>}
              <li className="flex justify-between"><span>Cash on Delivery fee</span><span>{formatPrice(pendingPriceQuote.pricing.codFee)}</span></li>
              <li className="flex justify-between border-t border-ivory-300 pt-2 font-bold text-charcoal-900"><span>Updated total</span><span>{formatPrice(pendingPriceQuote.pricing.totalAmount)}</span></li>
            </ul>
          </section>
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
                  <label htmlFor="checkout-email" className="block text-charcoal-400 font-semibold mb-1">Email Address *</label>
                  <input
                    id="checkout-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="patron@example.com"
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>
                <div>
                  <label htmlFor="checkout-phone" className="block text-charcoal-400 font-semibold mb-1">Mobile Phone (for delivery SMS) *</label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
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
                {savedAddresses.length > 0 && <label className="block text-charcoal-400 font-semibold">Use a saved address
                  <select value={selectedAddressId} onChange={(event) => {
                    const id = event.target.value;
                    setSelectedAddressId(id);
                    const address = savedAddresses.find((entry) => entry.id === id);
                    if (address) applySavedAddress(address);
                  }} className="mt-1 w-full rounded border border-ivory-300 bg-white p-2.5 text-charcoal-800">
                    <option value="">Enter a different address</option>
                    {savedAddresses.map((address) => <option key={address.id} value={address.id}>{address.fullName} — {address.houseFlat}, {address.city}{address.isDefault ? " (Default)" : ""}</option>)}
                  </select>
                </label>}
                <div>
                  <label htmlFor="checkout-fullName" className="block text-charcoal-400 font-semibold mb-1">Recipient Full Name *</label>
                  <input
                    id="checkout-fullName"
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Recipient's complete name"
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-pincode" className="block text-charcoal-400 font-semibold mb-1">PIN Code *</label>
                    <input
                      id="checkout-pincode"
                      type="text"
                      name="pincode"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={formData.pincode}
                      onChange={handlePincodeChange}
                      placeholder="6-digit PIN code"
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 font-mono"
                    />
                    {pincodeStatus === "VALID" && (
                      <span className="text-[10px] text-emerald-700 mt-1 block">
                        PIN code format accepted. Delivery availability is confirmed after dispatch.
                      </span>
                    )}
                  </div>
                  <div>
                    <label htmlFor="checkout-state" className="block text-charcoal-400 font-semibold mb-1">State *</label>
                    <select
                      id="checkout-state"
                      name="state"
                      autoComplete="address-level1"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
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
                    <label htmlFor="checkout-city" className="block text-charcoal-400 font-semibold mb-1">City / District *</label>
                    <input
                      id="checkout-city"
                      type="text"
                      name="city"
                      autoComplete="address-level2"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City or district"
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-houseFlat" className="block text-charcoal-400 font-semibold mb-1">House / Flat / Villa / Suite *</label>
                    <input
                      id="checkout-houseFlat"
                      type="text"
                      name="houseFlat"
                      autoComplete="address-line1"
                      required
                      value={formData.houseFlat}
                      onChange={handleChange}
                      placeholder="Flat, floor, building name"
                      className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-area" className="block text-charcoal-400 font-semibold mb-1">Street / Locality / Sector *</label>
                  <input
                    id="checkout-area"
                    type="text"
                    name="area"
                    autoComplete="address-line2"
                    required
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Road, locality, area"
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-landmark" className="block text-charcoal-400 font-semibold mb-1">Nearby Landmark (Optional)</label>
                  <input
                    id="checkout-landmark"
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Notable location or building nearby"
                    className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
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
                  className={`p-3.5 min-h-[64px] rounded border cursor-pointer flex flex-col justify-between transition-all focus-within:ring-2 focus-within:ring-gold-500 ${
                    deliveryMethod === "standard"
                      ? "border-gold-600 bg-gold-50/50"
                      : "border-ivory-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-charcoal-900">Standard Delivery</span>
                    <span className="text-gold-700 font-semibold">{subtotal >= 4999 ? "FREE" : "₹250"}</span>
                  </div>
                  <span className="text-[11px] text-charcoal-100">Delivery timing is confirmed after dispatch.</span>
                  <input
                    type="radio"
                    name="delivery"
                    className="sr-only"
                    checked={deliveryMethod === "standard"}
                    onChange={() => setDeliveryMethod("standard")}
                  />
                </label>

                <label
                  className={`p-3.5 min-h-[64px] rounded border cursor-pointer flex flex-col justify-between transition-all focus-within:ring-2 focus-within:ring-gold-500 ${
                    deliveryMethod === "express"
                      ? "border-gold-600 bg-gold-50/50"
                      : "border-ivory-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-charcoal-900">Priority Delivery</span>
                    <span className="text-gold-700 font-semibold">₹499</span>
                  </div>
                  <span className="text-[11px] text-charcoal-100">Priority dispatch; delivery timing is confirmed after dispatch.</span>
                  <input
                    type="radio"
                    name="delivery"
                    className="sr-only"
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
                {razorpayEnabled && <label
                  className={`p-4 min-h-[64px] rounded border cursor-pointer flex items-center justify-between transition-all focus-within:ring-2 focus-within:ring-gold-500 ${
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
                      className="text-gold-600 focus:ring-gold-500"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">
                        Pay securely with Razorpay
                      </span>
                      <span className="text-[11px] text-charcoal-100">
                        Payment methods available through Razorpay depend on your selected payment option.
                      </span>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-gold-600 shrink-0" />
                </label>}

                {/* Cash on Delivery */}
                <label
                  className={`p-4 min-h-[64px] rounded border cursor-pointer flex items-center justify-between transition-all focus-within:ring-2 focus-within:ring-gold-500 ${
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
                      className="text-gold-600 focus:ring-gold-500"
                    />
                    <div>
                      <span className="font-bold text-sm text-charcoal-900 block">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[11px] text-charcoal-100">
                        Pay when your order is delivered (+₹150 handling fee)
                      </span>
                    </div>
                  </div>
                  <Truck className="w-5 h-5 text-gold-600 shrink-0" />
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

              {(formData.fullName || formData.houseFlat || formData.city) && <div className="rounded border border-ivory-200 bg-white p-3 text-xs text-charcoal-600">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Delivering to</p>
                <p className="font-semibold text-charcoal-900">{formData.fullName}</p>
                <p>{[formData.houseFlat, formData.area, formData.landmark, formData.city, formData.state, formData.pincode, formData.country].filter(Boolean).join(", ")}</p>
              </div>}

              {/* Items preview list */}
              <div className="divide-y divide-ivory-200 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="relative aspect-[3/4] w-12 rounded bg-ivory-200 overflow-hidden shrink-0">
                      <ProductImage src={item.image} alt={item.title} />
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
                disabled={isProcessing || !validCart}
                className="w-full min-h-[52px] py-4 bg-charcoal-900 hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:bg-charcoal-200 text-ivory-50 text-xs uppercase tracking-[0.22em] font-semibold flex items-center justify-center gap-2 transition-all rounded shadow-luxury"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-ivory-50 border-t-transparent rounded-full animate-spin" />
                    <span>Securing Order Details...</span>
                  </span>
                ) : (
                  <>
                    <span>{pendingPriceQuote && paymentMethod === "COD" ? `Confirm updated total (${formatPrice(pendingPriceQuote.pricing.totalAmount)})` : `Place Order (${formatPrice(grandTotal)})`}</span>
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
