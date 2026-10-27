"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { ProductImage } from "@/components/shop/ProductImage";

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountAmount,
    total,
    freeShippingRemaining,
    freeShippingThreshold,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isCartOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponMsg({ text: res.message, isError: !res.success });
  };

  const freeShippingPercent = Math.min(100, Math.round(((freeShippingThreshold - freeShippingRemaining) / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-ivory-50 shadow-2xl flex flex-col border-l border-ivory-300">
          {/* Header */}
          <div className="p-5 border-b border-ivory-200 flex items-center justify-between bg-ivory-100">
            <div>
              <h2 className="font-serif text-2xl font-bold text-charcoal-900">Your Heritage Bag</h2>
              <p className="text-xs text-charcoal-100 mt-0.5">
                {cart.length} {cart.length === 1 ? "handcrafted treasure" : "handcrafted treasures"}
              </p>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-charcoal-200 hover:text-charcoal-900 transition-colors rounded-full hover:bg-ivory-200"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-ivory-200/80 px-5 py-3 border-b border-ivory-300">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-charcoal-300">
                {freeShippingRemaining > 0 ? (
                  <>Add <span className="font-bold text-charcoal-900">{formatPrice(freeShippingRemaining)}</span> more for Free Delivery</>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    ✓ You have unlocked Complimentary Express Shipping!
                  </span>
                )}
              </span>
              <span className="text-gold-600 font-bold">{freeShippingPercent}%</span>
            </div>
            <div className="w-full bg-ivory-300 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gold-500 h-full transition-all duration-500"
                style={{ width: `${freeShippingPercent}%` }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-ivory-200">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-charcoal-100">
                <div className="w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center mb-4">
                  <Tag className="w-8 h-8 text-gold-500" />
                </div>
                <h3 className="font-serif text-xl text-charcoal-900 font-semibold mb-2">
                  Your bag is empty
                </h3>
                <p className="text-sm text-charcoal-100 mb-6 max-w-xs">
                  Discover rare handlooms, Varanasi silks, and Kashmir pashminas woven with centuries of royal grace.
                </p>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 bg-charcoal-900 text-ivory-50 text-xs tracking-widest uppercase hover:bg-gold-600 transition-colors"
                >
                  Explore Collections
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="py-4 flex gap-4">
                  <div className="relative w-20 h-24 rounded bg-ivory-200 overflow-hidden shrink-0 border border-ivory-300">
                    <ProductImage src={item.image} alt={item.title} sizes="80px" />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-serif text-sm font-semibold text-charcoal-900 line-clamp-1 hover:text-gold-600 transition-colors"
                        >
                          {item.title}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-charcoal-100 hover:text-rose-600 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex gap-3 text-xs text-charcoal-100 mt-1">
                        <span>Size: <strong className="text-charcoal-300">{item.size}</strong></span>
                        <span>•</span>
                        <span>Color: <strong className="text-charcoal-300">{item.color}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-ivory-300 rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-ivory-100 text-charcoal-300 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold text-charcoal-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-ivory-100 text-charcoal-300 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="font-serif font-bold text-sm text-charcoal-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        {item.mrp > item.price && (
                          <div className="text-[10px] text-charcoal-50 line-through">
                            {formatPrice(item.mrp * item.quantity)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="border-t border-ivory-300 p-5 bg-ivory-100 space-y-4">
              {/* Coupon Form */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-gold-50 border border-gold-300 px-3 py-2 rounded text-xs">
                    <span className="font-medium text-gold-800">
                      Code <strong>{appliedCoupon.code}</strong> applied (-{formatPrice(discountAmount)})
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-rose-700 underline font-medium hover:text-rose-900"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. HERITAGE10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-white border border-ivory-300 px-3 py-2 text-xs uppercase focus:outline-none focus:border-gold-500 rounded"
                    />
                    <button
                      type="submit"
                      className="bg-charcoal-800 text-ivory-50 px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-gold-600 transition-colors rounded"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponMsg && (
                  <p className={`text-[11px] mt-1 ${couponMsg.isError ? "text-rose-600" : "text-emerald-700"}`}>
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* Order Summary */}
              <div className="space-y-1.5 text-xs text-charcoal-200">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{freeShippingRemaining === 0 ? "FREE" : formatPrice(250)}</span>
                </div>
                <div className="flex justify-between font-serif font-bold text-base text-charcoal-900 pt-2 border-t border-ivory-300">
                  <span>Estimated Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Checkout Link */}
              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-charcoal-900 text-ivory-50 text-xs uppercase tracking-[0.2em] font-semibold hover:bg-gold-600 transition-colors shadow-luxury rounded"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="flex items-center justify-center gap-2 text-[10px] text-charcoal-100">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-500" />
                <span>Order updates are provided after dispatch.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
