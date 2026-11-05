import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import BackToTop from "@/components/layout/BackToTop";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <BackToTop />
      </WishlistProvider>
    </CartProvider>
  );
}

