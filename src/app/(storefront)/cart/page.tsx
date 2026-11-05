"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
import { moveCartProductToWishlist } from "@/lib/cart-wishlist";
import { ProductImage } from "@/components/shop/ProductImage";

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
    cartSyncError,
  } = useCart();

  const { addToWishlistFromCart } = useWishlist();
  const [couponCode, setCouponCode] = useState("");
  const [couponEmail, setCouponEmail] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [movingToWishlistId, setMovingToWishlistId] = useState("");

  useEffect(() => {
    if (!appliedCoupon && couponMessage && !couponMessage.isError) setCouponMessage(null);
  }, [appliedCoupon, couponMessage]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || applyingCoupon) return;
    setApplyingCoupon(true);
    try {
      const res = await applyCoupon(couponCode, couponEmail);
      setCouponMessage({ text: res.message, isError: !res.success });
    } finally { setApplyingCoupon(false); }
  };

  const handleMoveToWishlist = async (itemId: string, productId: string) => {
    if (movingToWishlistId) return;
    setMovingToWishlistId(itemId); setWishlistMessage("");
    const result = await moveCartProductToWishlist({ itemId, productId, save: addToWishlistFromCart, remove: removeFromCart });
    setWishlistMessage(result.message);
    setMovingToWishlistId("");
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
        {wishlistMessage && <p role="status" className="mb-4 rounded border border-ivory-300 bg-ivory-50 p-3 text-sm text-charcoal-700">{wishlistMessage}</p>}
        {cartSyncError && <p role="alert" className="mb-4 rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{cartSyncError}</p>}

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
                        Add <strong className="text-charcoal-900">{formatPrice(freeShippingRemaining)}</strong> more to unlock complimentary standard shipping
                      </>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        You have unlocked complimentary standard shipping.
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
                      <ProductImage src={item.image} alt={item.title} />
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
                        <div className="flex items-center">
                          <div className="flex items-center border border-ivory-300 rounded bg-white">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center hover:bg-ivory-100 text-charcoal-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-l disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Decrease quantity of ${item.title}`}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 font-semibold text-charcoal-900 select-none min-w-[28px] text-center" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                              className="min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center hover:bg-ivory-100 text-charcoal-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-r disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Increase quantity of ${item.title}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {item.maxStock !== undefined && item.quantity >= item.maxStock && (
                            <span className="text-[10px] text-amber-700 ml-2 font-medium">
                              Max {item.maxStock} in stock
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 text-charcoal-200">
                          <button
                            onClick={() => void handleMoveToWishlist(item.id, item.productId)}
                            disabled={Boolean(movingToWishlistId)}
                            className="min-h-[44px] px-2.5 inline-flex items-center gap-1.5 hover:text-charcoal-900 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
                            aria-label={`Save ${item.title} to wishlist`}
                          >
                            <Heart className="w-3.5 h-3.5" />
                            <span>{movingToWishlistId === item.id ? "Saving…" : "Wishlist"}</span>
                          </button>

                          <button
                            onClick={() => saveForLater(item.id)}
                            className="min-h-[44px] px-2.5 inline-flex items-center gap-1.5 hover:text-charcoal-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
                            aria-label={`Save ${item.title} for later`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Save for Later</span>
                          </button>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="min-h-[44px] px-2.5 inline-flex items-center gap-1.5 hover:text-rose-700 text-rose-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
                            aria-label={`Remove ${item.title} from cart`}
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
                            <ProductImage src={sItem.image} alt={sItem.title} />
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
                    <input
                      type="email"
                      value={couponEmail}
                      onChange={(e) => setCouponEmail(e.target.value)}
                      placeholder="Checkout email (for eligibility)"
                      required
                      className="w-full bg-white border border-ivory-300 px-3 py-2 text-xs rounded focus:outline-none focus:border-gold-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        required
                        className="flex-1 bg-white border border-ivory-300 px-3 py-2 text-xs uppercase rounded focus:outline-none focus:border-gold-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={applyingCoupon}
                        className="px-4 py-2 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-wider font-semibold rounded transition-colors"
                      >
                        {applyingCoupon ? "Checking…" : "Apply"}
                      </button>
                    </div>
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
                    <span>Domestic Shipping</span>
                    <span>{shippingCharge === 0 ? "FREE" : formatPrice(shippingCharge)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>Included in product prices</span>
                  </div>

                  <div className="pt-3 border-t border-ivory-300 flex justify-between items-baseline">
                    <span className="font-serif font-bold text-lg text-charcoal-900">Total Amount</span>
                    <span className="font-serif font-bold text-2xl text-charcoal-900">{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full min-h-[48px] py-4 bg-charcoal-900 hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 text-ivory-50 text-xs uppercase tracking-[0.22em] font-semibold flex items-center justify-center gap-2 transition-colors rounded shadow-luxury"
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
