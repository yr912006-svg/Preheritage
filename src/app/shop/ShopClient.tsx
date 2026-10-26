"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X, Check, ChevronDown, RotateCcw } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { CATEGORIES, REGIONS, type ProductItem } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";

function ShopContent({ products, loadError }: { products: ProductItem[]; loadError?: boolean }) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialRegion = searchParams.get("region") || "";
  const initialQuery = searchParams.get("q") || "";
  const initialBadge = searchParams.get("badge") || "";

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedBadge, setSelectedBadge] = useState(initialBadge);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [priceRange, setPriceRange] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("FEATURED");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const allSizes = ["Free Size", "S", "M", "L", "XL", "XXL"];

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          product.title.toLowerCase().includes(q) ||
          product.shortDesc.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.state.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Region
      if (selectedRegion && product.region !== selectedRegion) {
        return false;
      }

      // Badge
      if (selectedBadge && product.badge !== selectedBadge) {
        return false;
      }

      // Size
      if (selectedSize && !product.sizes.includes(selectedSize)) {
        return false;
      }

      // Color
      if (selectedColor && !product.colors.some((c) => c.name.toLowerCase().includes(selectedColor.toLowerCase()))) {
        return false;
      }

      // Price Range
      if (priceRange === "UNDER_10K" && product.price >= 10000) return false;
      if (priceRange === "10K_TO_30K" && (product.price < 10000 || product.price > 30000)) return false;
      if (priceRange === "ABOVE_30K" && product.price <= 30000) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "PRICE_ASC") return a.price - b.price;
      if (sortBy === "PRICE_DESC") return b.price - a.price;
      if (sortBy === "RATING") return b.rating - a.rating;
      if (sortBy === "NEWEST") return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedRegion,
    selectedBadge,
    selectedSize,
    selectedColor,
    priceRange,
    sortBy,
  ]);

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSelectedRegion("");
    setSearchQuery("");
    setSelectedBadge("");
    setSelectedSize("");
    setSelectedColor("");
    setPriceRange("ALL");
    setSortBy("FEATURED");
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedRegion ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (selectedBadge ? 1 : 0) +
    (selectedSize ? 1 : 0) +
    (selectedColor ? 1 : 0) +
    (priceRange !== "ALL" ? 1 : 0);

  return (
    <div className="bg-ivory-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <div className="text-xs text-charcoal-100 mb-2 font-light">
            <span>Home</span> / <span>Collections</span> /{" "}
            <span className="text-charcoal-900 font-medium">
              {selectedCategory
                ? CATEGORIES.find((c) => c.slug === selectedCategory)?.name || selectedCategory
                : "All Treasures"}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-charcoal-900">
            {selectedCategory
              ? CATEGORIES.find((c) => c.slug === selectedCategory)?.name
              : selectedRegion
              ? `Heritage of ${REGIONS.find((r) => r.slug === selectedRegion)?.name || selectedRegion}`
              : "Curated Heritage Catalog"}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-200 mt-2 font-light max-w-2xl">
            Explore authentic handlooms, certified GI-lineage silks, and generational artisan garments woven across India.
          </p>
        </div>

        {/* Action Bar: Search, Filter Toggle, Sort */}
        <div className="bg-ivory-50 p-4 rounded-sm border border-ivory-300 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by silk, craft, state..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-ivory-300 text-xs focus:outline-none focus:border-gold-500 rounded"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-100 hover:text-charcoal-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-ivory-200 text-charcoal-900 text-xs uppercase tracking-wider font-semibold rounded"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold-600" />
              <span>Filters ({activeFiltersCount})</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-charcoal-100 hidden sm:inline">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-ivory-300 px-3 py-2 text-xs text-charcoal-900 rounded focus:outline-none focus:border-gold-500"
              >
                <option value="FEATURED">Curated Featured</option>
                <option value="NEWEST">Newest Launches</option>
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="RATING">Highest Patron Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
            <span className="text-charcoal-100 font-medium mr-1">Active Filters:</span>
            {selectedCategory && (
              <span className="bg-gold-100 text-gold-900 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRegion && (
              <span className="bg-gold-100 text-gold-900 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                Region: {selectedRegion}
                <button onClick={() => setSelectedRegion("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBadge && (
              <span className="bg-gold-100 text-gold-900 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                Badge: {selectedBadge}
                <button onClick={() => setSelectedBadge("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceRange !== "ALL" && (
              <span className="bg-gold-100 text-gold-900 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                Price: {priceRange}
                <button onClick={() => setPriceRange("ALL")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-700 underline hover:text-rose-900 ml-2 font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar Filters + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block space-y-6 bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-300">
              <h2 className="font-serif text-lg font-bold text-charcoal-900">Filter By</h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-gold-600 hover:text-gold-800 font-medium"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-charcoal-900 font-bold mb-3">
                Categories
              </h3>
              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`block w-full text-left py-1 transition-colors ${
                    !selectedCategory ? "text-gold-700 font-bold" : "text-charcoal-200 hover:text-charcoal-900"
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug === selectedCategory ? "" : cat.slug)}
                    className={`block w-full text-left py-1 transition-colors ${
                      selectedCategory === cat.slug
                        ? "text-gold-700 font-bold"
                        : "text-charcoal-200 hover:text-charcoal-900"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Ranges */}
            <div className="pt-4 border-t border-ivory-200">
              <h3 className="text-xs uppercase tracking-widest text-charcoal-900 font-bold mb-3">
                Price (INR)
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { id: "ALL", label: "All Prices" },
                  { id: "UNDER_10K", label: "Under ₹10,000" },
                  { id: "10K_TO_30K", label: "₹10,000 - ₹30,000" },
                  { id: "ABOVE_30K", label: "Above ₹30,000 (Royal Heirlooms)" },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setPriceRange(tier.id)}
                    className={`block w-full text-left py-1 transition-colors ${
                      priceRange === tier.id
                        ? "text-gold-700 font-bold"
                        : "text-charcoal-200 hover:text-charcoal-900"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Regional Clusters */}
            <div className="pt-4 border-t border-ivory-200">
              <h3 className="text-xs uppercase tracking-widest text-charcoal-900 font-bold mb-3">
                Craft Region
              </h3>
              <div className="space-y-1.5 text-xs">
                {REGIONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRegion(r.slug === selectedRegion ? "" : r.slug)}
                    className={`flex items-center justify-between w-full text-left py-1 transition-colors ${
                      selectedRegion === r.slug
                        ? "text-gold-700 font-bold"
                        : "text-charcoal-200 hover:text-charcoal-900"
                    }`}
                  >
                    <span>{r.name}</span>
                    <span className="text-[10px] text-charcoal-100">{r.state}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="pt-4 border-t border-ivory-200">
              <h3 className="text-xs uppercase tracking-widest text-charcoal-900 font-bold mb-3">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                    className={`px-2.5 py-1 text-xs uppercase font-medium rounded border transition-colors ${
                      selectedSize === size
                        ? "bg-charcoal-900 text-ivory-50 border-charcoal-900"
                        : "bg-white text-charcoal-900 border-ivory-300 hover:border-gold-500"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Grid Area */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-ivory-50 p-12 text-center rounded-sm border border-ivory-300">
                <div className="w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gold-500" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">
                  {loadError ? "The catalogue is temporarily unavailable" : products.length ? "No handcrafted pieces found" : "New heirlooms are being prepared"}
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-100 max-w-md mx-auto mb-6">
                  {loadError ? "Please return shortly while we restore the catalogue." : products.length ? "We could not find any creations matching your filters. Try resetting filters or searching with different craft keywords." : "Our current collection will appear here as soon as it is added to the catalogue."}
                </p>
                {products.length > 0 && <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal-900 text-ivory-50 text-xs uppercase tracking-widest font-semibold hover:bg-gold-600 transition-colors rounded"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center text-xs text-charcoal-100 mb-4 font-light">
                  <span>
                    Showing <strong>{filteredProducts.length}</strong> handcrafted {filteredProducts.length === 1 ? "piece" : "pieces"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopClient({ products, loadError }: { products: ProductItem[]; loadError?: boolean }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
          <div className="font-serif text-lg text-charcoal-900">Loading Preheritage Catalogue...</div>
        </div>
      }
    >
      <ShopContent products={products} loadError={loadError} />
    </Suspense>
  );
}
