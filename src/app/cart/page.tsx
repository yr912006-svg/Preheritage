"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trash2,
  Plus,
  Minus,
  Heart,
  ArrowRight,
  ShieldCheck,
  Tag,
  Bookmark,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice } from "@/lib/utils";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";

export default function CartPage() {
  const {
    cart,
    savedForLater,
    removeFromCart,
    updateQuantity,
    saveForLater,
    moveToCart,
    subtotal,
    discountAmount,
    shippingCharge,
    taxAmount,
    total,
    freeShippingRemaining,
    freeShippingThreshold,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { addToWishlist } = useWishlist();
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    const res = applyCoupon(couponCode);
    setCouponMessage({ text: res.message, isError: !res.success });
  };

  const handleMoveToWishlist = (itemId: string, productId: string) => {
    const prod = SAMPLE_PRODUCTS.find((p) => p.id === productId);
    if (prod) addToWishlist(prod);
    removeFromCart(itemId);
  };

  const freeShippingPercent = Math.min(
    100,
    Math.round(((freeShippingThreshold - freeShippingRemaining) / freeShippingThreshold) * 100)
  );

  return (
    <div className="bg-ivory-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 mb-2">
          Your Heritage Shopping Bag
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-100 font-light mb-8">
          {cart.length} {cart.length === 1 ? "handcrafted creation" : "handcrafted creations"} reserved in your bag
        </p>

        {cart.length === 0 ? (
          <div className="bg-ivory-50 p-12 text-center rounded-sm border border-ivory-300 shadow-sm max-w-xl mx-auto my-10">
            <div className="w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-gold-500" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">
              Your bag is currently empty
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-100 mb-6">
              Explore our curated handloom collections woven with royal Indian elegance.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold transition-colors rounded"
            >
              <span>Explore All Collections</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Items Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Free Shipping Progress Alert */}
              <div className="bg-ivory-50 p-4 rounded-sm border border-ivory-300 shadow-sm">
                <div className="flex justify-between items-center text-xs mb-2 font-medium">
                  <span className="text-charcoal-300">
                    {freeShippingRemaining > 0 ? (
                      <>
                        Add <strong className="text-charcoal-900">{formatPrice(freeShippingRemaining)}</strong> more to unlock Complimentary Express Shipping across India
                      </>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        You have unlocked Complimentary Insured Express Shipping!
                      </span>
                    )}
                  </span>
                  <span className="text-gold-700 font-bold">{freeShippingPercent}%</span>
                </div>
                <div className="w-full bg-ivory-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gold-500 h-full transition-all duration-500"
                    style={{ width: `${freeShippingPercent}%` }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm divide-y divide-ivory-200">
                {cart.map((item) => (
                  <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5">
                    {/* Thumbnail */}
                    <div className="relative aspect-[3/4] w-24 sm:w-28 rounded bg-ivory-200 overflow-hidden shrink-0 border border-ivory-300">
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <Link
                              href={`/products/${item.slug}`}
                              className="font-serif text-base sm:text-lg font-bold text-charcoal-900 hover:text-gold-700 transition-colors line-clamp-1"
                            >
                              {item.title}
                            </Link>
                            <div className="flex gap-4 text-xs text-charcoal-100 mt-1">
                              <span>Size: <strong className="text-charcoal-800">{item.size}</strong></span>
                              <span>Color: <strong className="text-charcoal-800">{item.color}</strong></span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-serif font-bold text-lg text-charcoal-900 block">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            {item.mrp > item.price && (
                              <span className="text-xs text-charcoal-50 line-through">
                                {formatPrice(item.mrp * item.quantity)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls: Quantity + Move to Wishlist + Save for Later + Delete */}
                      <div className="mt-4 pt-4 border-t border-ivory-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-ivory-300 rounded bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-ivory-100 text-charcoal-300"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 font-semibold text-charcoal-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-ivory-100 text-charcoal-300"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-charcoal-200">
                          <button
                            onClick={() => handleMoveToWishlist(item.id, item.productId)}
                            className="flex items-center gap-1 hover:text-charcoal-900 transition-colors"
                          >
                            <Heart className="w-3.5 h-3.5" />
                            <span>Wishlist</span>
                          </button>

                          <button
                            onClick={() => saveForLater(item.id)}
                            className="flex items-center gap-1 hover:text-charcoal-900 transition-colors"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Save for Later</span>
                          </button>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex items-center gap-1 hover:text-rose-700 text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Saved For Later Section */}
              {savedForLater.length > 0 && (
                <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
                  <h3 className="font-serif text-lg font-bold text-charcoal-900 mb-4">
                    Saved For Later ({savedForLater.length})
                  </h3>
                  <div className="divide-y divide-ivory-200">
                    {savedForLater.map((sItem) => (
                      <div key={sItem.id} className="py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative aspect-[3/4] w-12 rounded bg-ivory-200 overflow-hidden shrink-0">
                            <Image src={sItem.image} alt={sItem.title} fill className="object-cover" />
                          </div>
                          <div>
                            <div className="font-serif text-sm font-semibold text-charcoal-900 line-clamp-1">
                              {sItem.title}
                            </div>
                            <div className="text-xs text-charcoal-100">{formatPrice(sItem.price)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => moveToCart(sItem.id)}
                          className="px-4 py-2 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-wider font-semibold rounded"
                        >
                          Move to Bag
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Summary Column */}
            <div className="lg:col-span-4 space-y-6">
              {/* Coupon Box */}
              <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm">
                <h3 className="font-serif text-base font-bold text-charcoal-900 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gold-600" />
                  <span>Royal Privileges & Coupons</span>
                </h3>

                {appliedCoupon ? (
                  <div className="bg-gold-50 border border-gold-300 p-3 rounded text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gold-900 block">{appliedCoupon.code}</span>
                      <span className="text-gold-700">Discount of {formatPrice(discountAmount)} applied</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-rose-700 underline font-semibold hover:text-rose-900"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="e.g. HERITAGE10"
                        className="flex-1 bg-white border border-ivory-300 px-3 py-2 text-xs uppercase rounded focus:outline-none focus:border-gold-500 font-mono"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-wider font-semibold rounded transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="text-[11px] text-charcoal-100 font-light">
                      Available offers: <button type="button" onClick={() => setCouponCode("HERITAGE10")} className="underline font-medium text-gold-700">HERITAGE10</button> or <button type="button" onClick={() => setCouponCode("FIRSTWEAR")} className="underline font-medium text-gold-700">FIRSTWEAR</button>
                    </p>
                  </form>
                )}
                {couponMessage && (
                  <p className={`text-xs mt-2 ${couponMessage.isError ? "text-rose-600" : "text-emerald-700"}`}>
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Order Calculation Breakdown */}
              <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm space-y-4">
                <h3 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-300">
                  Order Summary
                </h3>

                <div className="space-y-2 text-xs text-charcoal-200">
                  <div className="flex justify-between">
                    <span>Bag Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Privilege Discount</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Insured Domestic Shipping</span>
                    <span>{shippingCharge === 0 ? "FREE" : formatPrice(shippingCharge)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>GST (5% Handloom Tax Included)</span>
                    <span>{formatPrice(taxAmount)}</span>
                  </div>

                  <div className="pt-3 border-t border-ivory-300 flex justify-between items-baseline">
                    <span className="font-serif font-bold text-lg text-charcoal-900">Total Amount</span>
                    <span className="font-serif font-bold text-2xl text-charcoal-900">{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full py-4 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-[0.22em] font-semibold flex items-center justify-center gap-2 transition-colors rounded shadow-luxury"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="pt-4 border-t border-ivory-200 space-y-2 text-[11px] text-charcoal-100 font-light">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0" />
                    <span>Safe & Encrypted 256-Bit SSL Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-600 shrink-0" />
                    <span>Complimentary signature gift-box with every order</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
