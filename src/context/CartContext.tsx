"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ProductItem } from "@/lib/sample-data";

export interface CartItem {
  id: string; // unique item id (productId + size + color)
  productId: string;
  title: string;
  slug: string;
  price: number;
  mrp: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
  isSavedForLater?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  savedForLater: CartItem[];
  addToCart: (product: ProductItem, size?: string, color?: string, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  saveForLater: (itemId: string) => void;
  moveToCart: (itemId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  appliedCoupon: { code: string; discount: number; type: "PERCENT" | "FIXED" } | null;
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
const STANDARD_SHIPPING_CHARGE = 250;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: "PERCENT" | "FIXED";
  } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("preheritage_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedLater = localStorage.getItem("preheritage_saved_later");
      if (savedLater) setSavedForLater(JSON.parse(savedLater));

      const coupon = localStorage.getItem("preheritage_coupon");
      if (coupon) setAppliedCoupon(JSON.parse(coupon));
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
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
  }, [cart, savedForLater, appliedCoupon]);

  const addToCart = (
    product: ProductItem,
    size?: string,
    color?: string,
    quantity = 1
  ) => {
    const chosenSize = size || product.sizes[0] || "Standard";
    const chosenColor = color || product.colors[0]?.name || "Original";
    const itemId = `${product.id}-${chosenSize}-${chosenColor}`;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === itemId);
      if (existing) {
        return prevCart.map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.maxStock) }
            : item
        );
      }
      return [
        ...prevCart,
        {
          id: itemId,
          productId: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          mrp: product.mrp,
          image: product.images[0],
          size: chosenSize,
          color: chosenColor,
          quantity,
          maxStock: product.stock,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.min(quantity, item.maxStock) }
          : item
      )
    );
  };

  const saveForLater = (itemId: string) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    setSavedForLater((prev) => [...prev, item]);
  };

  const moveToCart = (itemId: string) => {
    const item = savedForLater.find((i) => i.id === itemId);
    if (!item) return;
    setSavedForLater((prev) => prev.filter((i) => i.id !== itemId));
    setCart((prev) => [...prev, item]);
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string) => {
    const upper = code.trim().toUpperCase();
    if (upper === "HERITAGE10") {
      setAppliedCoupon({ code: upper, discount: 10, type: "PERCENT" });
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
      setAppliedCoupon({ code: upper, discount: 15, type: "PERCENT" });
      return { success: true, message: "15% welcome discount applied!" };
    }
    return { success: false, message: "Invalid coupon code. Try HERITAGE10 or FIRSTWEAR" };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "PERCENT") {
      discountAmount = Math.round((subtotal * appliedCoupon.discount) / 100);
    } else {
      discountAmount = appliedCoupon.discount;
    }
  }

  const shippingCharge =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_CHARGE;

  const taxAmount = Math.round((subtotal - discountAmount) * 0.05); // 5% GST on luxury textiles
  const total = Math.max(0, subtotal - discountAmount + shippingCharge + taxAmount);

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
