"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { CATEGORIES, REGIONS } from "@/lib/sample-data";

export const Header: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const headerRef = useRef<HTMLElement>(null);

  // Reset transient open overlays on route transitions
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
  };

  return (
    <>
      <header
        ref={headerRef}
        id="site-header"
        role="banner"
        className="sticky top-0 z-50 w-full bg-[#F8F2E7] border-b border-[#E8DFC8] shadow-xs"
      >
        <div className="w-full bg-[#F8F2E7] py-3.5 sm:py-4 lg:py-4">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-x-2">
              {/* Left: Category menu toggle */}
              <div className="flex min-w-0 items-center justify-self-start">
                <button
                  onClick={() => setIsMobileMenuOpen((open) => !open)}
                  className="inline-flex h-10 w-10 items-center justify-center text-[#24201D] hover:text-[#B08A45] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                  aria-label="Open navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="preheritage-category-menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>

              {/* Center: Brand Identity Logo */}
              <div className="flex justify-center justify-self-center">
                <Logo compactOnMobile variant="dark" />
              </div>

              {/* Right: Search, Wishlist, Account, Cart */}
              <div className="flex items-center justify-self-end gap-0.5 sm:gap-2 lg:gap-3">
                {/* Search Button */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex h-10 w-9 sm:w-10 items-center justify-center text-[#24201D] hover:text-[#B08A45] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                  aria-label="Search store"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Wishlist */}
                <Link
                  href="/account/wishlist"
                  className="relative inline-flex h-10 w-9 sm:w-10 items-center justify-center text-[#24201D] hover:text-[#B08A45] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                  aria-label="View wishlist"
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-burgundy text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                {/* Account */}
                <Link
                  href="/account"
                  className="inline-flex h-10 w-9 sm:w-10 items-center justify-center text-[#24201D] hover:text-[#B08A45] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                  aria-label="Account profile"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>

                {/* Cart Drawer Trigger */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative inline-flex h-10 w-9 sm:w-10 items-center justify-center text-[#24201D] hover:text-[#B08A45] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                  aria-label="Shopping bag"
                >
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  {totalItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {totalItemsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop Editorial Navigation Links */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center justify-center gap-8 pt-3 text-[11px] uppercase tracking-[0.24em] font-medium text-[#24201D] lg:flex"
            >
              <Link href="/shop" className="editorial-nav-link text-[#24201D] hover:text-[#B08A45] transition-colors">
                Shop All
              </Link>
              <Link href="/shop?category=sarees" className="editorial-nav-link text-[#24201D] hover:text-[#B08A45] transition-colors">
                Sarees
              </Link>
              <Link href="/shop?category=kurtas" className="editorial-nav-link text-[#24201D] hover:text-[#B08A45] transition-colors">
                Kurtas
              </Link>
              <Link href="/collections/mens-ethnic-wear" className="editorial-nav-link text-[#24201D] hover:text-[#B08A45] transition-colors">
                Men&apos;s Wear
              </Link>
              <Link href="/shop?badge=BESTSELLER" className="editorial-nav-link text-[#24201D] hover:text-[#B08A45] transition-colors">
                Bestsellers
              </Link>
              <Link href="/journal" className="editorial-nav-link text-[#24201D] hover:text-[#B08A45] transition-colors">
                Journal
              </Link>
              <Link href="/about" className="editorial-nav-link text-[#24201D] hover:text-[#B08A45] transition-colors">
                Our Memoir
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Live Search Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-charcoal-900/70 px-4 pt-24 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Search store"
        >
          <div className="w-full max-w-2xl bg-[#F8F2E7] rounded-sm shadow-2xl border border-ivory-300 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-300">
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#24201D]/70">
                Search PREHERITAGE
              </span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center text-[#24201D]/70 hover:text-[#24201D]"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Varanasi silk, Pashmina, Chanderi, Gota Patti, Jamdani..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-ivory-300 text-sm focus:outline-none focus:border-gold-500 rounded font-sans text-charcoal-900"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="bg-charcoal-900 text-ivory-50 px-6 py-3 text-xs uppercase tracking-widest font-semibold hover:bg-gold-600 transition-colors rounded"
              >
                Search
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-ivory-200 text-xs text-charcoal-400">
              <span className="font-semibold text-charcoal-600 mr-2">Curated searches:</span>
              <div className="inline-flex flex-wrap gap-2 mt-1">
                {["Katan Silk", "Pashmina Shawl", "Gota Patti", "Ajrakh Kurta", "Jamdani", "Temple Gold"].map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                        router.push(`/shop?q=${encodeURIComponent(tag)}`);
                        setIsSearchOpen(false);
                      }}
                      className="px-2.5 py-1 bg-white border border-ivory-300 hover:border-gold-500 rounded text-charcoal-700 transition-colors"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          id="preheritage-category-menu"
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          <div
            className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-sm bg-[#F8F2E7] p-6 shadow-2xl overflow-y-auto flex flex-col justify-between border-r border-[#E8DFC8]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-ivory-300">
                <Logo compactOnMobile variant="dark" />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center text-[#24201D] hover:text-[#B08A45] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08A45]"
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-6 space-y-4 text-sm font-medium tracking-wide text-charcoal-900">
                <Link
                  href="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 border-b border-ivory-300 font-serif text-base text-[#24201D] hover:text-[#B08A45]"
                >
                  All Collections
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-1 text-[#24201D]/80 hover:text-[#B08A45] transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}

                <div className="pt-4 border-t border-ivory-300">
                  <div className="text-[11px] uppercase tracking-widest text-[#B08A45] font-bold mb-2">
                    Shop by Cultural Region
                  </div>
                  <div className="space-y-1.5 pl-2">
                    {REGIONS.map((r) => (
                      <Link
                        key={r.id}
                        href={`/shop?region=${r.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-xs text-[#24201D]/70 hover:text-[#B08A45] py-1"
                      >
                        {r.name} ({r.craft})
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-ivory-300 space-y-2 text-xs">
                  <Link
                    href="/journal"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-[#24201D]/70 hover:text-[#B08A45]"
                  >
                    Cultural Journal
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-[#24201D]/70 hover:text-[#B08A45]"
                  >
                    The Preheritage Story
                  </Link>
                  <Link
                    href="/track-order"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-[#24201D]/70 hover:text-[#B08A45]"
                  >
                    Track My Order
                  </Link>
                  <Link
                    href="/account/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-[#24201D]/70 hover:text-[#B08A45]"
                  >
                    Wishlist
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-ivory-300">
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 bg-[#24201D] text-ivory-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-semibold hover:bg-[#B08A45] transition-colors rounded"
              >
                <User className="w-4 h-4" />
                <span>My Account / Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
