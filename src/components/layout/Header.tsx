"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  MapPin,
} from "lucide-react";
import Logo from "./Logo";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { CATEGORIES, REGIONS } from "@/lib/sample-data";

export const Header: React.FC = () => {
  const router = useRouter();
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-ivory-50/95 backdrop-blur-md shadow-luxury py-3 border-b border-ivory-300"
            : "bg-ivory-100 py-4 border-b border-ivory-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Mobile Menu Trigger & Main Desktop Nav */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden text-charcoal-800 hover:text-gold-600 transition-colors p-1"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <nav className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-[0.16em] font-medium text-charcoal-800">
                <Link href="/shop" className="hover:text-gold-600 transition-colors py-1">
                  All Collections
                </Link>
                <Link href="/shop?category=sarees" className="hover:text-gold-600 transition-colors py-1">
                  Sarees
                </Link>
                <Link href="/shop?category=kurtas" className="hover:text-gold-600 transition-colors py-1">
                  Kurtas
                </Link>
                <Link href="/shop?category=lehengas" className="hover:text-gold-600 transition-colors py-1">
                  Lehengas
                </Link>
                <Link href="/shop?category=handloom" className="hover:text-gold-600 transition-colors py-1">
                  Handloom
                </Link>

                {/* Region Mega Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsRegionDropdownOpen(true)}
                  onMouseLeave={() => setIsRegionDropdownOpen(false)}
                >
                  <button className="flex items-center gap-1 hover:text-gold-600 transition-colors py-1">
                    <span>By Region</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {isRegionDropdownOpen && (
                    <div className="absolute top-full left-0 w-80 bg-ivory-50 shadow-2xl border border-ivory-300 p-4 rounded-sm animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                      <div className="text-[10px] tracking-widest uppercase text-gold-600 font-bold mb-3 flex items-center gap-1.5 border-b border-ivory-200 pb-2">
                        <MapPin className="w-3 h-3 text-gold-500" />
                        <span>Indian Weaving Clusters</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs normal-case tracking-normal">
                        {REGIONS.map((r) => (
                          <Link
                            key={r.id}
                            href={`/shop?region=${r.slug}`}
                            className="p-2 hover:bg-ivory-200 rounded transition-colors group"
                          >
                            <span className="font-serif font-semibold text-charcoal-900 group-hover:text-gold-700 block">
                              {r.name}
                            </span>
                            <span className="text-[11px] text-charcoal-100 block truncate">
                              {r.craft}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/journal" className="hover:text-gold-600 transition-colors py-1">
                  Cultural Journal
                </Link>
              </nav>
            </div>

            {/* Center: Brand Identity Logo */}
            <div className="flex-1 flex justify-center lg:flex-initial">
              <Logo />
            </div>

            {/* Right: Search, Wishlist, Account, Cart */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-charcoal-800 hover:text-gold-600 transition-colors p-1"
                aria-label="Search store"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="relative text-charcoal-800 hover:text-gold-600 transition-colors p-1"
                aria-label="View wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-heritage-crimson text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link
                href="/account"
                className="text-charcoal-800 hover:text-gold-600 transition-colors p-1"
                aria-label="Account profile"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative text-charcoal-800 hover:text-gold-600 transition-colors p-1"
                aria-label="Shopping bag"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Live Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/70 backdrop-blur-md flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-2xl bg-ivory-50 rounded-sm shadow-2xl border border-ivory-300 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-300">
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-charcoal-400">
                Search PREHERITAGE
              </span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-charcoal-200 hover:text-charcoal-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-100" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Varanasi silk, Pashmina, Chanderi, Gota Patti, Jamdani..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-ivory-300 text-sm focus:outline-none focus:border-gold-500 rounded font-sans"
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

            <div className="mt-4 pt-4 border-t border-ivory-200 text-xs text-charcoal-100">
              <span className="font-semibold text-charcoal-400 mr-2">Curated searches:</span>
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
                      className="px-2.5 py-1 bg-ivory-200 hover:bg-gold-100 hover:text-gold-800 text-charcoal-300 rounded text-[11px] transition-colors"
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

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-ivory-50 h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-ivory-300">
                <Logo />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-charcoal-200 hover:text-charcoal-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-6 space-y-4 text-sm font-medium tracking-wide text-charcoal-900">
                <Link
                  href="/shop"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 border-b border-ivory-200 font-serif text-base"
                >
                  All Collections
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-1 text-charcoal-200 hover:text-gold-600 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}

                <div className="pt-4 border-t border-ivory-300">
                  <div className="text-[11px] uppercase tracking-widest text-gold-600 font-bold mb-2">
                    Shop by Cultural Region
                  </div>
                  <div className="space-y-1.5 pl-2">
                    {REGIONS.map((r) => (
                      <Link
                        key={r.id}
                        href={`/shop?region=${r.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-xs text-charcoal-300 hover:text-gold-700 py-1"
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
                    className="block text-charcoal-300 hover:text-gold-600"
                  >
                    Cultural Journal
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-charcoal-300 hover:text-gold-600"
                  >
                    The Preheritage Story
                  </Link>
                  <Link
                    href="/track-order"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-charcoal-300 hover:text-gold-600"
                  >
                    Track My Order
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-ivory-300">
              <Link
                href="/account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 bg-charcoal-900 text-ivory-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold-600 transition-colors rounded"
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
