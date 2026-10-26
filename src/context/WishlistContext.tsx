"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ProductItem } from "@/lib/sample-data";

interface WishlistContextType {
  wishlist: ProductItem[];
  addToWishlist: (product: ProductItem) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: ProductItem) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  notifyRestock: (productId: string, email: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<ProductItem[]>([]);
  const [wishlistReady, setWishlistReady] = useState(false);
  const [accountWishlist, setAccountWishlist] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("preheritage_wishlist");
      if (saved) setWishlist(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load wishlist", e);
    } finally {
      setWishlistReady(true);
    }
  }, []);

  useEffect(() => {
    if (!wishlistReady) return;
    let active = true;
    void fetch("/api/account/wishlist").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      if (!active) return;
      if (data.products?.length) setWishlist(data.products);
      else if (wishlist.length) {
        await Promise.all(wishlist.map((item) => fetch("/api/account/wishlist", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.id }),
        })));
      }
      if (active) setAccountWishlist(true);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [wishlistReady]);

  useEffect(() => {
    if (!wishlistReady) return;
    try {
      localStorage.setItem("preheritage_wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save wishlist", e);
    }
  }, [wishlist, wishlistReady]);

  const addToWishlist = (product: ProductItem) => {
    if (accountWishlist) void fetch("/api/account/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) }).catch(() => undefined);
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    if (accountWishlist) void fetch("/api/account/wishlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) }).catch(() => undefined);
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const toggleWishlist = (product: ProductItem) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const clearWishlist = () => {
    if (accountWishlist) void Promise.all(wishlist.map((item) => fetch("/api/account/wishlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.id }) }))).catch(() => undefined);
    setWishlist([]);
  };

  const notifyRestock = (_productId: string, _email: string) => undefined;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        notifyRestock,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};
