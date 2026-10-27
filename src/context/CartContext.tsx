"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ProductItem } from "@/lib/sample-data";
import {
  calculateCartSubtotal,
  calculateCheckoutTotal,
  calculateCouponDiscount,
  calculateShippingCharge,
  createCartItem,
  mergeCartItem,
  normalizeCartItems,
  normalizeCartCoupon,
  removeCartItem,
  setCartItemQuantity,
  type CartCoupon,
  type CartItem,
} from "@/lib/cart-model";

interface CartContextType {
  cart: CartItem[];
  savedForLater: CartItem[];
  addToCart: (product: ProductItem, size?: string, color?: string, quantity?: number) => { success: boolean; message?: string };
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  saveForLater: (itemId: string) => void;
  moveToCart: (itemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: CartCoupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 4999;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CartCoupon | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [accountCart, setAccountCart] = useState(false);

  const syncAccountCart = (init?: RequestInit) => {
    void fetch("/api/account/cart", init)
      .then((response) => {
        if (response.status === 401) setAccountCart(false);
      })
      .catch(() => undefined);
  };

  // Guest state is kept separately; signed-in state always comes from the server.
  useEffect(() => {
    let active = true;
    const restoreGuestCart = () => {
      try {
        const savedCart = localStorage.getItem("preheritage_cart");
        const savedLater = localStorage.getItem("preheritage_saved_later");
        const coupon = localStorage.getItem("preheritage_coupon");
        setCart(normalizeCartItems(savedCart ? JSON.parse(savedCart) : []));
        setSavedForLater(normalizeCartItems(savedLater ? JSON.parse(savedLater) : []));
        setAppliedCoupon(normalizeCartCoupon(coupon ? JSON.parse(coupon) : null));
      } catch {
        setCart([]);
        setSavedForLater([]);
        setAppliedCoupon(null);
      }
    };

    void fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => {
      const session = response.ok ? await response.json() : null;
      if (!active) return;
      const user = session?.user as { id?: string; role?: string } | undefined;
      const isCustomer = Boolean(user?.id && user.role === "CUSTOMER");
      setAccountCart(isCustomer);
      setCart([]);
      setSavedForLater([]);
      setAppliedCoupon(null);
      if (!isCustomer) restoreGuestCart();
      setStorageReady(true);
    }).catch(() => {
      if (!active) return;
      setAccountCart(false);
      restoreGuestCart();
      setStorageReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!storageReady || !accountCart) return;
    let active = true;
    void fetch("/api/account/cart").then(async (response) => {
      if (response.status === 401) {
        try {
          const savedCart = localStorage.getItem("preheritage_cart");
          const savedLater = localStorage.getItem("preheritage_saved_later");
          const coupon = localStorage.getItem("preheritage_coupon");
          setCart(normalizeCartItems(savedCart ? JSON.parse(savedCart) : []));
          setSavedForLater(normalizeCartItems(savedLater ? JSON.parse(savedLater) : []));
          setAppliedCoupon(normalizeCartCoupon(coupon ? JSON.parse(coupon) : null));
        } catch {
          setCart([]);
          setSavedForLater([]);
          setAppliedCoupon(null);
        }
        setAccountCart(false);
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      if (!active) return;
      if (data.items) {
        const accountItems = normalizeCartItems(data.items.map((item: any) => ({
          id: `${item.productId}-${item.size}-${item.color}`,
          productId: item.productId,
          variantId: item.variantId || undefined,
          title: item.product.title,
          slug: item.product.slug,
          price: item.price,
          mrp: item.product.mrp,
          image: item.product.images[0] || "",
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          maxStock: item.maxStock,
        })));

        // Keep items already restored from this browser while merging the
        // account cart. Prefer the greater quantity for matching variants.
        setCart(accountItems);
      }
      setAccountCart(true);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [storageReady, accountCart]);

  // Save to localStorage on change
  useEffect(() => {
    if (!storageReady) return;
    try {
      if (accountCart) return;
      localStorage.setItem("preheritage_cart", JSON.stringify(cart));
      localStorage.setItem("preheritage_saved_later", JSON.stringify(savedForLater));
      if (appliedCoupon) {
        localStorage.setItem("preheritage_coupon", JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem("preheritage_coupon");
      }
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  }, [cart, savedForLater, appliedCoupon, storageReady, accountCart]);

  const addToCart = (
    product: ProductItem,
    size?: string,
    color?: string,
    quantity = 1
  ) => {
    const created = createCartItem(product, size, color, quantity);
    if (!created.item) return { success: false, message: created.message || "This item could not be added." };
    const existing = normalizeCartItems(cart).find((item) => item.id === created.item?.id);
    const acceptedQuantity = Math.min(created.item.quantity, created.item.maxStock - (existing?.quantity || 0));
    if (acceptedQuantity < 1) return { success: false, message: "You have reached the available quantity for this selection." };
    const item = { ...created.item, quantity: acceptedQuantity };
    setCart((previous) => mergeCartItem(previous, item));
    if (accountCart) syncAccountCart({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.productId, variantId: item.variantId, quantity: acceptedQuantity }) });
    setIsCartOpen(true);
    return { success: true };
  };

  const removeFromCart = (itemId: string) => {
    const removed = cart.find((item) => item.id === itemId);
    if (accountCart && removed) syncAccountCart({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: removed.productId, variantId: removed.variantId }) });
    setCart((prev) => removeCartItem(prev, itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const changed = cart.find((item) => item.id === itemId);
    if (!changed || changed.maxStock < 1) return;
    const nextQuantity = Math.min(quantity, changed.maxStock, 20);
    if (accountCart) syncAccountCart({ method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: changed.productId, variantId: changed.variantId, quantity: nextQuantity }) });
    setCart((prev) => setCartItemQuantity(prev, itemId, nextQuantity));
  };

  const saveForLater = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;
    if (accountCart) syncAccountCart({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.productId, variantId: item.variantId }) });
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    setSavedForLater((prev) => [...prev, item]);
  };

  const moveToCart = (itemId: string) => {
    const item = savedForLater.find((i) => i.id === itemId);
    if (!item) return;
    const safeItem = normalizeCartItems([item])[0];
    if (!safeItem) return;
    const existing = normalizeCartItems(cart).find((entry) => entry.id === safeItem.id);
    const acceptedQuantity = Math.min(safeItem.quantity, safeItem.maxStock - (existing?.quantity || 0));
    if (acceptedQuantity < 1) return;
    const movingItem = { ...safeItem, quantity: acceptedQuantity };
    setSavedForLater((prev) => prev.filter((entry) => entry.id !== itemId));
    setCart((prev) => mergeCartItem(prev, movingItem));
    if (accountCart) syncAccountCart({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: movingItem.productId, variantId: movingItem.variantId, quantity: acceptedQuantity }) });
  };

  const clearCart = () => {
    if (accountCart) syncAccountCart({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: true }) });
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string) => {
    const upper = code.trim().toUpperCase();
    if (upper === "HERITAGE10") {
      if (subtotal < 4999) return { success: false, message: "HERITAGE10 requires a minimum order of ₹4,999." };
      setAppliedCoupon({ code: upper, discount: 10, type: "PERCENT", minimumOrderValue: 4999, maxDiscount: 5000 });
      return { success: true, message: "10% Royal Heritage discount applied!" };
    }
    if (upper === "ROYAL2000") {
      if (subtotal < 19999) {
        return { success: false, message: "ROYAL2000 requires minimum order value of ₹19,999" };
      }
      setAppliedCoupon({ code: upper, discount: 2000, type: "FIXED" });
      return { success: true, message: "₹2,000 royal discount applied!" };
    }
    if (upper === "FIRSTWEAR") {
      if (subtotal < 2999) return { success: false, message: "FIRSTWEAR requires a minimum order of ₹2,999." };
      setAppliedCoupon({ code: upper, discount: 15, type: "PERCENT", minimumOrderValue: 2999 });
      return { success: true, message: "15% welcome discount applied!" };
    }
    return { success: false, message: "Invalid coupon code. Try HERITAGE10 or FIRSTWEAR" };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = calculateCartSubtotal(cart);
  const discountAmount = calculateCouponDiscount(appliedCoupon, subtotal);

  const shippingCharge = calculateShippingCharge(subtotal);

  const taxAmount = 0; // Product prices are already displayed inclusive of taxes.
  const total = calculateCheckoutTotal({ subtotal, discountAmount, shippingCharge });

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const totalItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        savedForLater,
        addToCart,
        removeFromCart,
        updateQuantity,
        saveForLater,
        moveToCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        shippingCharge,
        taxAmount,
        total,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingRemaining,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
