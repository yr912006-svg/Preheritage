"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { ProductItem } from "@/lib/sample-data";
import { persistCartQuantityUpdate } from "@/lib/cart-quantity-sync";
import {
  calculateCartSubtotal,
  calculateCheckoutTotal,
  calculateShippingCharge,
  createCartItem,
  mergeCartItem,
  normalizeCartItems,
  removeCartItem,
  setCartItemQuantity,
  updateCartItemImage as updateCartItemImageModel,
  type CartItem,
} from "@/lib/cart-model";

type AppliedCartCoupon = { code: string; discountAmount: number; freeShipping: boolean; subtotal: number };

interface CartContextType {
  cart: CartItem[];
  savedForLater: CartItem[];
  addToCart: (product: ProductItem, size?: string, color?: string, quantity?: number, image?: string) => { success: boolean; message?: string };
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCartItemImage: (itemId: string, image: string) => void;
  saveForLater: (itemId: string) => void;
  moveToCart: (itemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: AppliedCartCoupon | null;
  applyCoupon: (code: string, email: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  totalItemsCount: number;
  cartSyncError: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 4999;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCartCoupon | null>(null);
  const currentCartKey = JSON.stringify(cart.map((item) => ({ productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity })));
  const currentCartKeyRef = useRef(currentCartKey);
  currentCartKeyRef.current = currentCartKey;
  const [storageReady, setStorageReady] = useState(false);
  const [accountCart, setAccountCart] = useState(false);
  const [cartSyncError, setCartSyncError] = useState("");
  const quantityUpdatesInFlight = useRef(new Set<string>());

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
        const items = normalizeCartItems(savedCart ? JSON.parse(savedCart) : []);
        setCart((prev) => (prev.length > 0 ? prev : items));
        setSavedForLater(normalizeCartItems(savedLater ? JSON.parse(savedLater) : []));
        localStorage.removeItem("preheritage_coupon");
        setAppliedCoupon(null);
      } catch {
        // preserve current state on storage error
      }
    };

    // Restore immediately on mount so items are available without waiting for network
    restoreGuestCart();

    void fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => {
      const session = response.ok ? await response.json() : null;
      if (!active) return;
      const user = session?.user as { id?: string; role?: string } | undefined;
      const isCustomer = Boolean(user?.id && user.role === "CUSTOMER");
      setAccountCart(isCustomer);
      if (isCustomer) {
        setCart([]);
        setSavedForLater([]);
        setAppliedCoupon(null);
      } else {
        restoreGuestCart();
      }
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
          setCart(normalizeCartItems(savedCart ? JSON.parse(savedCart) : []));
          setSavedForLater(normalizeCartItems(savedLater ? JSON.parse(savedLater) : []));
          localStorage.removeItem("preheritage_coupon");
          setAppliedCoupon(null);
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
      localStorage.removeItem("preheritage_coupon");
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  }, [cart, savedForLater, storageReady, accountCart]);

  const addToCart = (
    product: ProductItem,
    size?: string,
    color?: string,
    quantity = 1,
    image?: string
  ) => {
    const created = createCartItem(product, size, color, quantity, image);
    if (!created.item) return { success: false, message: created.message || "This item could not be added." };
    const existing = normalizeCartItems(cart).find((item) => item.id === created.item?.id);
    const acceptedQuantity = Math.min(created.item.quantity, created.item.maxStock - (existing?.quantity || 0));
    if (acceptedQuantity < 1) return { success: false, message: "You have reached the available quantity for this selection." };
    const item = { ...created.item, quantity: acceptedQuantity };
    setAppliedCoupon(null);
    setCart((previous) => {
      const nextCart = mergeCartItem(previous, item);
      try {
        if (!accountCart) {
          localStorage.setItem("preheritage_cart", JSON.stringify(nextCart));
        }
      } catch { /* storage fallback */ }
      return nextCart;
    });
    if (accountCart) syncAccountCart({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.productId, variantId: item.variantId, quantity: acceptedQuantity }) });
    setIsCartOpen(true);
    return { success: true };
  };

  const updateCartItemImage = (itemId: string, image: string) => {
    if (!image) return;
    setCart((previous) => {
      const nextCart = updateCartItemImageModel(previous, itemId, image);
      try {
        if (!accountCart) {
          localStorage.setItem("preheritage_cart", JSON.stringify(nextCart));
        }
      } catch { /* storage fallback */ }
      return nextCart;
    });
  };

  const removeFromCart = (itemId: string) => {
    const removed = cart.find((item) => item.id === itemId);
    if (accountCart && removed) syncAccountCart({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: removed.productId, variantId: removed.variantId }) });
    setAppliedCoupon(null);
    setCart((prev) => removeCartItem(prev, itemId));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const changed = cart.find((item) => item.id === itemId);
    if (!changed || changed.maxStock < 1) return;
    const nextQuantity = Math.min(quantity, changed.maxStock, 20);
    if (accountCart) {
      if (quantityUpdatesInFlight.current.has(itemId)) return;
      quantityUpdatesInFlight.current.add(itemId);
      const result = await persistCartQuantityUpdate(nextQuantity, async () => {
        const response = await fetch("/api/account/cart", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: changed.productId, variantId: changed.variantId, quantity: nextQuantity }) });
        const data: unknown = await response.json().catch(() => null);
        const message = data && typeof data === "object" && "message" in data && typeof data.message === "string" ? data.message : undefined;
        return { ok: response.ok, message };
      });
      quantityUpdatesInFlight.current.delete(itemId);
      if (result.success === false) {
        setCartSyncError(result.message);
        return;
      }
      setCartSyncError("");
      setAppliedCoupon(null);
      setCart((prev) => setCartItemQuantity(prev, itemId, nextQuantity));
      return;
    }
    setCartSyncError("");
    setAppliedCoupon(null);
    setCart((prev) => setCartItemQuantity(prev, itemId, nextQuantity));
  };

  const saveForLater = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;
    if (accountCart) syncAccountCart({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.productId, variantId: item.variantId }) });
    setAppliedCoupon(null);
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
    setAppliedCoupon(null);
    setSavedForLater((prev) => prev.filter((entry) => entry.id !== itemId));
    setCart((prev) => mergeCartItem(prev, movingItem));
    if (accountCart) syncAccountCart({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: movingItem.productId, variantId: movingItem.variantId, quantity: acceptedQuantity }) });
  };

  const clearCart = () => {
    if (accountCart) syncAccountCart({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: true }) });
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string, email: string) => {
    const items = cart.map((item) => ({ productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity }));
    if (!items.length) return { success: false, message: "Add an item to your bag before applying a coupon." };
    const requestedCartKey = JSON.stringify(items);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email, items }),
      });
      const result = await response.json();
      if (!response.ok || !result.valid) return { success: false, message: result.message || "This coupon could not be applied." };
      if (currentCartKeyRef.current !== requestedCartKey) {
        return { success: false, message: "Your bag changed while we checked the coupon. Please apply it again." };
      }
      if (Math.round(Number(result.subtotal) * 100) !== Math.round(calculateCartSubtotal(cart) * 100)) {
        return { success: false, message: "Current product prices differ from your bag. Refresh your bag before applying this coupon." };
      }
      setAppliedCoupon({ code: result.code, discountAmount: result.discountAmount, freeShipping: result.freeShipping, subtotal: result.subtotal });
      const discountText = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(result.discountAmount);
      return { success: true, message: result.freeShipping ? `${result.code} applied with free shipping.` : `${result.code} applied. ${discountText} discount.` };
    } catch {
      return { success: false, message: "Coupon eligibility is temporarily unavailable. Please try again." };
    }
  };
  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = calculateCartSubtotal(cart);
  const couponMatchesCart = Boolean(appliedCoupon && Math.round(appliedCoupon.subtotal * 100) === Math.round(subtotal * 100));
  const discountAmount = couponMatchesCart && appliedCoupon ? appliedCoupon.discountAmount : 0;

  const shippingCharge = couponMatchesCart && appliedCoupon?.freeShipping ? 0 : calculateShippingCharge(subtotal);

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
        updateCartItemImage,
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
        cartSyncError,
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
