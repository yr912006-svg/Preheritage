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

  const syncAccountWishlist = (init?: RequestInit) => {
    void fetch("/api/account/wishlist", init)
      .then((response) => {
        if (response.status === 401) setAccountWishlist(false);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    let active = true;
    const restoreGuestWishlist = () => {
      try {
        const saved = localStorage.getItem("preheritage_guest_wishlist");
        setWishlist(saved ? JSON.parse(saved) : []);
      } catch {
        setWishlist([]);
      }
    };

    void fetch("/api/auth/session", { cache: "no-store" }).then(async (response) => {
      const session = response.ok ? await response.json() : null;
      if (!active) return;
      const user = session?.user as { id?: string; role?: string } | undefined;
      const isCustomer = Boolean(user?.id && user.role === "CUSTOMER");
      setAccountWishlist(isCustomer);
      setWishlist([]);
      if (!isCustomer) restoreGuestWishlist();
      setWishlistReady(true);
    }).catch(() => {
      if (!active) return;
      setAccountWishlist(false);
      restoreGuestWishlist();
      setWishlistReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!wishlistReady || !accountWishlist) return;
    let active = true;
    void fetch("/api/account/wishlist").then(async (response) => {
      if (response.status === 401) {
        try {
          const saved = localStorage.getItem("preheritage_guest_wishlist");
          setWishlist(saved ? JSON.parse(saved) : []);
        } catch {
          setWishlist([]);
        }
        setAccountWishlist(false);
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      if (!active) return;
      setWishlist(data.products || []);
      if (active) setAccountWishlist(true);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [wishlistReady, accountWishlist]);

  useEffect(() => {
    if (!wishlistReady) return;
    try {
      if (accountWishlist) return;
      localStorage.setItem("preheritage_guest_wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.error("Failed to save wishlist", e);
    }
  }, [wishlist, wishlistReady, accountWishlist]);

  const addToWishlist = (product: ProductItem) => {
    if (accountWishlist) syncAccountWishlist({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    if (accountWishlist) syncAccountWishlist({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
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
    if (accountWishlist) wishlist.forEach((item) => syncAccountWishlist({ method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.id }) }));
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
