"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X, Check, ChevronDown, RotateCcw, Sparkles, ArrowRight } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import type { ProductItem } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";
import { DEFAULT_AVAILABILITY_FILTER, filterCatalogByAvailability, parseAvailabilityFilter, type AvailabilityFilter } from "@/lib/catalog-availability";

const CATEGORY_EDITORIAL_INFO: Record<string, { banner: string; subtitle: string; title: string; description: string }> = {
  sarees: {
    banner: "/images/campaign/couture-saree-mineral.jpg",
    subtitle: "Sacred Looms of India · Sarees",
    title: "Six Yards of Unstitched Poetry",
    description: "Handwoven pure Katan, Kadwa, and Jamdani silks woven across the sacred looms of Varanasi, Bengal, and Kanchipuram.",
  },
  kurtas: {
    banner: "/images/categories/category-kurtas.jpg",
    subtitle: "Awadh & Chanderi Tailoring · Kurtas & Tunics",
    title: "Modern Poise, Ancient Weaves",
    description: "Breathable silks, handspun khadi, and delicate zardozi detailing tailored for timeless grace.",
  },
  lehengas: {
    banner: "/images/campaign/occasion-burgundy-gala.jpg",
    subtitle: "Marwar & Rajputana Splendor · Lehengas",
    title: "Regal Silhouettes & Gota Patti",
    description: "Flowing raw silk ensembles adorned with genuine metal ribbon appliqué, zardozi, and hand-embroidery.",
  },
  handloom: {
    banner: "/images/campaign/macro-silk-zari.jpg",
    subtitle: "GI-Tagged Master Clusters · Pure Handloom",
    title: "Living Traditions of the Loom",
    description: "Pure GI-tagged heritage weaves from master artisan clusters preserving ancestral handcrafting techniques.",
  },
  handicrafts: {
    banner: "/images/categories/category-handicrafts.jpg",
    subtitle: "Tribal & Metal Artistry · Handicrafts & Décor",
    title: "Hand-Chiseled Brass & Heirlooms",
    description: "Lost-wax cast Dhokra bell metal, hand-chiseled brass, and wooden heirloom artifacts for your living spaces.",
  },
  posters: {
    banner: "/images/categories/category-posters.jpg",
    subtitle: "Limited Edition Archival Prints · Art Posters",
    title: "Timeless Architectural Marvels",
    description: "Limited-edition archival prints depicting India's timeless spiritual ghats and sacred heritage architecture.",
  },
  accessories: {
    banner: "/images/categories/category-accessories.jpg",
    subtitle: "Himalayan Whisper · Accessories & Shawls",
    title: "Pure Pashmina & Heirloom Accents",
    description: "Pure Changthangi Pashmina wraps, Sozni needlework, and handcrafted antique gold accents.",
  },
  "mens-ethnic-wear": {
    banner: "/images/campaign/imperial-menswear-ivory.jpg",
    subtitle: "Private Atelier Capsule · Men’s Ethnic Wear",
    title: "Heritage, Worn Your Way",
    description: "Classic kurtas and refined Nehru jackets with clean silhouettes, considered details, and a heritage-inspired point of view.",
  },
};

const REGION_EDITORIAL_INFO: Record<string, { banner: string; subtitle: string; title: string; description: string }> = {
  kashmir: {
    banner: "/images/regions/region-kashmir.jpg",
    subtitle: "Craft Lineage · Kashmir",
    title: "Changthangi Cashmere & Sozni Stitches",
    description: "Woven high in the Himalayas, where Changthangi goat wool meets the centuries-old delicate art of Sozni needlework passed down through Kashmiri artisan families.",
  },
  varanasi: {
    banner: "/images/regions/region-varanasi.jpg",
    subtitle: "Craft Lineage · Varanasi",
    title: "Kashi Katan Silk & Antique Zari",
    description: "On the ghats of the Ganges, master weavers translate Mughal motifs and celestial flora into intricate woven zari brocades on pit looms.",
  },
  rajasthan: {
    banner: "/images/regions/region-rajasthan.jpg",
    subtitle: "Craft Lineage · Rajasthan",
    title: "Gota Patti & Royal Bandhej",
    description: "From Jaipur to Jodhpur, desert artisan guilds tie thousands of tiny knots on georgette and silk to create kaleidoscopic royal celebrations.",
  },
  gujarat: {
    banner: "/images/regions/region-gujarat.jpg",
    subtitle: "Craft Lineage · Kutch & Patan",
    title: "Double Ikkat Patola & Ajrakh",
    description: "Ancient block printers and silk weavers using organic indigo, madder root, and intricate double-warp resist dyeing that lasts generations.",
  },
  bengal: {
    banner: "/images/regions/region-bengal.jpg",
    subtitle: "Craft Lineage · Bengal",
    title: "Jamdani & Kantha Stitches",
    description: "The finest muslin woven with discontinuous weft technique that was once described as 'woven wind' by ancient Roman travelers.",
  },
  tamilnadu: {
    banner: "/images/regions/region-tamilnadu.jpg",
    subtitle: "Craft Lineage · Kanchipuram",
    title: "Temple Kanjeevaram Silks",
    description: "Interlocking korvai weaving technique incorporating temple borders, peacocks (Mayil), and Rudraksha motifs interwoven with luminous gold zari borders.",
  },
};

type FilterOption = { id: string; name: string; slug: string; state?: string };
type ShopProps = { products: ProductItem[]; categories: FilterOption[]; collections: FilterOption[]; regions: FilterOption[]; loadError?: boolean };

function ShopContent({ products, categories, collections, regions, loadError }: ShopProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialRegion = searchParams.get("region") || "";
  const initialCollection = searchParams.get("collection") || "";
  const initialQuery = searchParams.get("q") || "";
  const initialBadge = searchParams.get("badge") || "";

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedRegion(searchParams.get("region") || "");
    setSelectedCollection(searchParams.get("collection") || "");
    setSearchQuery(searchParams.get("q") || "");
    setSelectedBadge(searchParams.get("badge") || "");
  }, [searchParams]);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedCollection, setSelectedCollection] = useState(initialCollection);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [fabricQuery, setFabricQuery] = useState("");
  const [selectedBadge, setSelectedBadge] = useState(initialBadge);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>(DEFAULT_AVAILABILITY_FILTER);
  const [priceRange, setPriceRange] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("FEATURED");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const allSizes = useMemo(() => Array.from(new Set(products.flatMap((product) => product.sizes))).sort((a, b) => a.localeCompare(b)), [products]);
  const allColors = useMemo(() => Array.from(new Set(products.flatMap((product) => product.colors.map((color) => color.name)))).sort((a, b) => a.localeCompare(b)), [products]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return filterCatalogByAvailability(products, availabilityFilter).filter((product) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          product.title.toLowerCase().includes(q) ||
          product.shortDesc.toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.description.toLowerCase().includes(q) ||
          product.culturalStory.toLowerCase().includes(q) ||
          product.fabricDetails.toLowerCase().includes(q) ||
          product.state.toLowerCase().includes(q) ||
          product.region.toLowerCase().includes(q) ||
          product.sizes.some((size) => size.toLowerCase().includes(q)) ||
          product.colors.some((color) => color.name.toLowerCase().includes(q)) ||
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

      // Fabric details are editorial text in the existing catalog, so filter by substring.
      if (fabricQuery.trim() && !product.fabricDetails.toLowerCase().includes(fabricQuery.trim().toLowerCase())) return false;

      if (selectedCollection && product.collection !== selectedCollection) return false;

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
      if (priceRange === "30K_TO_50K" && (product.price < 30000 || product.price > 50000)) return false;
      if (priceRange === "ABOVE_50K" && product.price <= 50000) return false;
      if (priceRange === "ABOVE_30K" && product.price <= 30000) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "PRICE_ASC") return a.price - b.price;
      if (sortBy === "PRICE_DESC") return b.price - a.price;
      if (sortBy === "RATING") return b.rating - a.rating;
      if (sortBy === "NEWEST") {
        const dateDifference = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        return dateDifference || (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      }
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedRegion,
    fabricQuery,
    selectedCollection,
    selectedBadge,
    selectedSize,
    selectedColor,
    availabilityFilter,
    priceRange,
    sortBy,
  ]);

  const editorialInfo = useMemo(() => {
    if (selectedCategory && CATEGORY_EDITORIAL_INFO[selectedCategory]) {
      return CATEGORY_EDITORIAL_INFO[selectedCategory];
    }
    if (selectedRegion && REGION_EDITORIAL_INFO[selectedRegion]) {
      return REGION_EDITORIAL_INFO[selectedRegion];
    }
    if (selectedCollection) {
      const col = collections.find((c) => c.slug === selectedCollection);
      return {
        banner: "/images/categories/category-sarees.jpg",
        subtitle: "Private Collection Edit",
        title: col?.name || selectedCollection,
        description: "Explore curated handcrafted pieces from this capsule collection.",
      };
    }
    return {
      banner: "/images/categories/category-sarees.jpg",
      subtitle: "PREHERITAGE · Wear the Stories of India",
      title: "The Handcrafted Collection",
      description: "Explore authentic heirloom pieces woven across India's sacred master textile clusters, selected directly from the PREHERITAGE catalogue.",
    };
  }, [selectedCategory, selectedRegion, selectedCollection, collections]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory, selectedRegion, fabricQuery, selectedCollection, selectedBadge, selectedSize, selectedColor, priceRange, sortBy, availabilityFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSelectedRegion("");
    setFabricQuery("");
    setSelectedCollection("");
    setSearchQuery("");
    setSelectedBadge("");
    setSelectedSize("");
    setSelectedColor("");
    setAvailabilityFilter(DEFAULT_AVAILABILITY_FILTER);
    setPriceRange("ALL");
    setSortBy("FEATURED");
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedRegion ? 1 : 0) +
    (fabricQuery.trim() ? 1 : 0) +
    (selectedCollection ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (selectedBadge ? 1 : 0) +
    (selectedSize ? 1 : 0) +
    (selectedColor ? 1 : 0) +
    (availabilityFilter !== DEFAULT_AVAILABILITY_FILTER ? 1 : 0) +
    (priceRange !== "ALL" ? 1 : 0);

  return (
    <div className="min-h-screen bg-ivory-100 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial collection masthead */}
        <div className="relative isolate mb-8 min-h-[340px] overflow-hidden border-b border-ivory-300 bg-[#EDE4D6] sm:mb-12 sm:min-h-[400px]">
          <Image
            src={editorialInfo.banner}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="-z-20 object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#F8F2E7] via-[#F8F2E7]/95 to-[#F8F2E7]/30" />
          <div className="relative flex min-h-[340px] max-w-3xl flex-col justify-center px-6 py-10 sm:min-h-[400px] sm:px-10 sm:py-14 lg:py-16">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-[.24em] text-gold-700 sm:text-xs">
              <Link href="/" className="hover:text-charcoal-900 transition-colors">Home</Link>
              <span className="mx-2 text-charcoal-400">/</span>
              <span>Collections</span>
              {selectedCategory && (
                <>
                  <span className="mx-2 text-charcoal-400">/</span>
                  <span className="text-charcoal-900 font-semibold">{categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
                </>
              )}
            </div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.24em] text-gold-700 sm:text-xs">
              {editorialInfo.subtitle}
            </p>
            <h1 className="max-w-2xl font-serif text-4xl font-normal leading-[1.02] text-charcoal-900 sm:text-5xl lg:text-6xl">
              {editorialInfo.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-charcoal-700 sm:text-base">
              {editorialInfo.description}
            </p>
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[.22em] text-gold-700">The edit</p>
            <p className="mt-1 font-serif text-xl text-charcoal-900 sm:text-2xl">
              {selectedCategory
                ? categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory
                : selectedRegion
                ? `From ${regions.find((r) => r.slug === selectedRegion)?.name || selectedRegion}`
                : selectedCollection
                ? collections.find((c) => c.slug === selectedCollection)?.name || selectedCollection
                : "Discover the collection"}
            </p>
          </div>
          <p className="text-xs text-charcoal-500">{filteredProducts.length} {filteredProducts.length === 1 ? "piece" : "pieces"}</p>
        </div>

        {/* Action Bar: Search, Filter Toggle, Sort */}
        <div className="flex flex-col items-center justify-between gap-3 border-y border-ivory-300 bg-transparent py-4 sm:flex-row sm:gap-4 sm:py-5">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-charcoal-100 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by silk, craft, state..."
              aria-label="Search products"
              className="min-h-11 w-full border border-ivory-300 bg-ivory-50 py-2 pl-10 pr-10 text-sm focus:border-gold-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center text-charcoal-400 hover:text-charcoal-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 border border-ivory-400 bg-ivory-50 px-4 text-xs font-semibold uppercase tracking-wider text-charcoal-900 transition-colors hover:border-gold-600 lg:hidden"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold-600" />
              <span>Filters ({activeFiltersCount})</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-charcoal-100 hidden sm:inline">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="min-h-11 max-w-[220px] border border-ivory-300 bg-ivory-50 px-3 py-2 text-xs text-charcoal-900 focus:border-gold-600 focus:outline-none"
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
          <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
            <span className="mr-1 font-medium uppercase tracking-[.14em] text-charcoal-500">Filtered by</span>
            {selectedCategory && (
              <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">
                {categories.find((item) => item.slug === selectedCategory)?.name || selectedCategory}
                <button aria-label="Clear category filter" className="inline-flex h-6 w-6 items-center justify-center" onClick={() => setSelectedCategory("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRegion && (
              <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">
                {regions.find((item) => item.slug === selectedRegion)?.name || selectedRegion}
                <button aria-label="Clear region filter" className="inline-flex h-6 w-6 items-center justify-center" onClick={() => setSelectedRegion("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {fabricQuery.trim() && <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">Fabric: {fabricQuery}<button onClick={() => setFabricQuery("")} aria-label="Clear fabric filter" className="inline-flex h-6 w-6 items-center justify-center"><X className="w-3 h-3" /></button></span>}
            {selectedCollection && (
              <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">
                Collection: {collections.find((item) => item.slug === selectedCollection)?.name || selectedCollection}
                <button className="inline-flex h-6 w-6 items-center justify-center" onClick={() => setSelectedCollection("")} aria-label="Clear collection filter"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBadge && (
              <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">
                Badge: {selectedBadge}
                <button aria-label="Clear product label filter" className="inline-flex h-6 w-6 items-center justify-center" onClick={() => setSelectedBadge("")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceRange !== "ALL" && (
              <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">
                Price: {priceRange}
                <button aria-label="Clear price filter" className="inline-flex h-6 w-6 items-center justify-center" onClick={() => setPriceRange("ALL")}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {availabilityFilter !== DEFAULT_AVAILABILITY_FILTER && <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">{availabilityFilter === "IN_STOCK" ? "In stock" : "Out of stock"}<button onClick={() => setAvailabilityFilter(DEFAULT_AVAILABILITY_FILTER)} aria-label="Clear availability filter" className="inline-flex h-6 w-6 items-center justify-center"><X className="w-3 h-3" /></button></span>}
            {selectedSize && <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">Size: {selectedSize}<button onClick={() => setSelectedSize("")} aria-label="Clear size filter" className="inline-flex h-6 w-6 items-center justify-center"><X className="w-3 h-3" /></button></span>}
            {selectedColor && <span className="inline-flex min-h-8 items-center gap-1.5 border border-ivory-400 bg-ivory-50 px-2.5 font-medium text-charcoal-700">Colour: {selectedColor}<button onClick={() => setSelectedColor("")} aria-label="Clear colour filter" className="inline-flex h-6 w-6 items-center justify-center"><X className="w-3 h-3" /></button></span>}
            <button
              onClick={clearAllFilters}
              className="ml-2 min-h-8 px-2 text-xs font-semibold text-charcoal-700 underline decoration-gold-600 underline-offset-4 hover:text-gold-800"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Content Layout: Sidebar Filters + Grid */}
        {isMobileFilterOpen && <div className="fixed inset-0 z-50 bg-charcoal-900/50 p-4 lg:hidden" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setIsMobileFilterOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" className="ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto rounded-sm border border-ivory-300 bg-ivory-50 p-5 shadow-luxury">
            <div className="flex items-center justify-between border-b border-ivory-300 pb-4"><h2 id="mobile-filter-title" className="font-serif text-xl font-bold text-charcoal-900">Filter the collection</h2><button type="button" onClick={() => setIsMobileFilterOpen(false)} aria-label="Close filters" className="rounded p-2 text-charcoal-600 hover:bg-ivory-200"><X className="h-4 w-4" /></button></div>
            <div className="flex-1 space-y-4 py-4 text-xs">
              <label className="block font-semibold text-charcoal-700">Category<select className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
              <label className="block font-semibold text-charcoal-700">Craft region<select className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}><option value="">All regions</option>{regions.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
              <label className="block font-semibold text-charcoal-700">Collection<select className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" value={selectedCollection} onChange={(event) => setSelectedCollection(event.target.value)}><option value="">All collections</option>{collections.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
              <label className="block font-semibold text-charcoal-700">Product label<select className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" value={selectedBadge} onChange={(event) => setSelectedBadge(event.target.value)}><option value="">All products</option><option value="NEW">New arrivals</option><option value="BESTSELLER">Bestsellers</option><option value="LIMITED_EDITION">Limited edition</option><option value="SALE">On sale</option></select></label>
              <label className="block font-semibold text-charcoal-700">Fabric details<input className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" type="search" value={fabricQuery} onChange={(event) => setFabricQuery(event.target.value)} placeholder="e.g. silk, cotton, zari" /></label>
              <label className="block font-semibold text-charcoal-700">Availability<select className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" value={availabilityFilter} onChange={(event) => setAvailabilityFilter(parseAvailabilityFilter(event.target.value))}><option value="ALL">All products</option><option value="IN_STOCK">In stock</option><option value="OUT_OF_STOCK">Out of stock</option></select></label>
              <label className="block font-semibold text-charcoal-700">Price<select className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" value={priceRange} onChange={(event) => setPriceRange(event.target.value)}><option value="ALL">All prices</option><option value="UNDER_10K">Under ₹10,000</option><option value="10K_TO_30K">₹10,000–₹30,000</option><option value="30K_TO_50K">₹30,000–₹50,000</option><option value="ABOVE_50K">Above ₹50,000 (Royal Heirlooms)</option></select></label>
              <label className="block font-semibold text-charcoal-700">Size<select className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}><option value="">All sizes</option>{allSizes.map((size) => <option key={size}>{size}</option>)}</select></label>
              <label className="block font-semibold text-charcoal-700">Colour<select className="mt-1 w-full rounded border border-ivory-300 bg-white px-3 py-2" value={selectedColor} onChange={(event) => setSelectedColor(event.target.value)}><option value="">All colours</option>{allColors.map((color) => <option key={color}>{color}</option>)}</select></label>
            </div>
            <div className="flex gap-3 border-t border-ivory-300 pt-4"><button type="button" onClick={clearAllFilters} className="flex-1 rounded border border-ivory-400 px-4 py-2.5 font-semibold text-charcoal-700">Clear filters</button><button type="button" onClick={() => setIsMobileFilterOpen(false)} className="flex-1 rounded bg-charcoal-900 px-4 py-2.5 font-semibold uppercase tracking-wider text-ivory-50">Show {filteredProducts.length} results</button></div>
          </section>
        </div>}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
          {/* Desktop Filter Sidebar */}
          <aside aria-label="Catalog filters" className="hidden h-fit space-y-6 border-r border-ivory-300 pr-6 lg:sticky lg:top-40 lg:block">
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
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug === selectedCategory ? "" : cat.slug)}
                    className={`block w-full text-left py-1 transition-colors ${
                      selectedCategory === cat.slug
                        ? "text-gold-700 font-bold"
                        : "text-charcoal-200 hover:text-charcoal-900"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3"><span>{cat.name}</span>{!loadError && <span className="text-[10px] text-charcoal-100">{products.filter((product) => product.category === cat.slug).length}</span>}</span>
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
                  { id: "30K_TO_50K", label: "₹30,000 - ₹50,000" },
                  { id: "ABOVE_50K", label: "Above ₹50,000 (Royal Heirlooms)" },
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
                {regions.map((r) => (
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
                    {r.state && <span className="text-[10px] text-charcoal-100">{r.state}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-ivory-200">
              <h3 className="text-xs uppercase tracking-widest text-charcoal-900 font-bold mb-2">Fabric details</h3>
              <input type="search" value={fabricQuery} onChange={(event) => setFabricQuery(event.target.value)} placeholder="Silk, cotton, zari…" aria-label="Filter by fabric details" className="w-full rounded border border-ivory-300 bg-white px-3 py-2 text-xs focus:border-gold-500 focus:outline-none" />
            </div>

            <div className="pt-4 border-t border-ivory-200">
              <h3 className="text-xs uppercase tracking-widest text-charcoal-900 font-bold mb-3">Availability</h3>
              <div className="space-y-2 text-xs">
                {[{ value: DEFAULT_AVAILABILITY_FILTER, label: "All products" }, { value: "IN_STOCK", label: "In stock" }, { value: "OUT_OF_STOCK", label: "Out of stock" }].map((option) => <button key={option.value} type="button" onClick={() => setAvailabilityFilter(parseAvailabilityFilter(option.value))} className={`block w-full text-left py-1 ${availabilityFilter === option.value ? "font-bold text-gold-700" : "text-charcoal-200 hover:text-charcoal-900"}`}>{option.label}</button>)}
              </div>
            </div>

            <div>
              <h3 className="text-xs text-charcoal-900 font-bold mb-3">Collections</h3>
              <div className="space-y-1.5 text-xs">
                {collections.map((collection) => <button key={collection.id} onClick={() => setSelectedCollection(collection.slug === selectedCollection ? "" : collection.slug)} className={`block w-full text-left py-1 ${selectedCollection === collection.slug ? "font-bold text-gold-700" : "text-charcoal-200 hover:text-charcoal-900"}`}>{collection.name}</button>)}
                {!collections.length && <p className="text-charcoal-400">No collections available.</p>}
              </div>
            </div>

            <div className="border-t border-ivory-300 pt-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-charcoal-900">Product label</h3>
              <div className="space-y-2 text-xs">
                {[{ value: "NEW", label: "New arrivals" }, { value: "BESTSELLER", label: "Bestsellers" }, { value: "LIMITED_EDITION", label: "Limited edition" }, { value: "SALE", label: "On sale" }].map((option) => <button key={option.value} type="button" onClick={() => setSelectedBadge(selectedBadge === option.value ? "" : option.value)} aria-pressed={selectedBadge === option.value} className={`block min-h-8 w-full text-left ${selectedBadge === option.value ? "font-semibold text-gold-800" : "text-charcoal-600 hover:text-charcoal-900"}`}>{option.label}</button>)}
              </div>
            </div>

            <div className="border-t border-ivory-300 pt-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-charcoal-900">Colour</h3>
              <div className="flex flex-wrap gap-2">
                {allColors.map((color) => <button key={color} type="button" onClick={() => setSelectedColor(selectedColor === color ? "" : color)} aria-pressed={selectedColor === color} className={`min-h-9 border px-2.5 text-xs transition-colors ${selectedColor === color ? "border-charcoal-900 bg-charcoal-900 text-ivory-50" : "border-ivory-300 bg-ivory-50 text-charcoal-700 hover:border-gold-600"}`}>{color}</button>)}
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
          </aside>

          {/* Product Grid Area */}
          <div className="min-w-0">
            {filteredProducts.length === 0 ? (
              selectedCategory === "mens-ethnic-wear" ? (
                <div className="rounded-sm border border-gold-300 bg-ivory-50/95 p-8 text-center sm:p-14 shadow-luxury">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-gold-700 font-sans block mb-2">
                    Private Atelier Capsule · Men’s Ethnic Wear
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal-900 mb-3">
                    Artisan Weaving &amp; Master Tailoring in Progress
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-600 max-w-lg mx-auto mb-8 leading-relaxed">
                    Our inaugural menswear editions—including the Aangan Cotton Kurta and Rekha Heritage Bandi—are currently undergoing master tailoring and authentication at our partner looms. Publication details and release orders will open shortly.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                      href="/contact"
                      className="inline-flex min-h-12 items-center gap-2 rounded-xs bg-charcoal-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ivory-50 transition-colors hover:bg-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      <span>Inquire with Atelier Concierge</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/collections/mens-ethnic-wear"
                      className="inline-flex min-h-12 items-center gap-2 rounded-xs border border-ivory-400 bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-900 transition-colors hover:border-gold-500 hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      <span>Explore Inaugural Capsule Page</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("sarees")}
                      className="inline-flex min-h-12 items-center gap-2 rounded-xs border border-transparent px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold-800 hover:underline"
                    >
                      <span>Browse Active Sarees &amp; Silks</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-y border-ivory-300 bg-ivory-50 px-5 py-14 text-center sm:px-12">
                  <div className="w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gold-500" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-charcoal-900 mb-2">
                    {loadError ? "The catalogue is temporarily unavailable" : products.length ? "No handcrafted pieces found" : "New heirlooms are being prepared"}
                  </h3>
                  <p className="text-xs sm:text-sm text-charcoal-100 max-w-md mx-auto mb-6">
                    {loadError ? "Please return shortly while we restore the catalogue." : products.length ? "We could not find any creations matching your current filters. Try resetting filters or searching with different craft keywords." : "Our artisans are currently preparing new pieces for this collection. Please check back shortly or explore our active sarees."}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-charcoal-900 text-ivory-50 text-xs uppercase tracking-widest font-semibold hover:bg-gold-600 transition-colors rounded-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset All Filters</span>
                      </button>
                    )}
                    {selectedCategory && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("sarees")}
                        className="inline-flex items-center gap-2 px-6 py-3 border border-ivory-400 bg-white text-charcoal-900 text-xs uppercase tracking-widest font-semibold hover:border-gold-500 hover:text-gold-700 transition-colors rounded-xs"
                      >
                        <span>View Active Sarees</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between text-xs font-light text-charcoal-500">
                  <span>
                    Showing <strong>{filteredProducts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> handcrafted {filteredProducts.length === 1 ? "piece" : "pieces"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 xl:grid-cols-3">
                  {pagedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {pageCount > 1 && <nav aria-label="Catalog pages" className="mt-8 flex items-center justify-center gap-2">
                  <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="border border-ivory-300 bg-ivory-50 px-3 py-2 text-xs disabled:opacity-40">Previous</button>
                  <span className="px-3 text-xs text-charcoal-500">Page {currentPage} of {pageCount}</span>
                  <button type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} className="border border-ivory-300 bg-ivory-50 px-3 py-2 text-xs disabled:opacity-40">Next</button>
                </nav>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopClient({ products, categories, collections, regions, loadError }: ShopProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-100" aria-busy="true" aria-label="Loading collection">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-10 h-48 animate-pulse bg-ivory-200 sm:h-64" />
            <div className="mb-8 h-10 max-w-sm animate-pulse bg-ivory-200" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => <div key={index} className="animate-pulse"><div className="aspect-[4/5] bg-ivory-200" /><div className="mt-3 h-3 w-2/3 bg-ivory-200" /><div className="mt-2 h-4 w-1/2 bg-ivory-200" /></div>)}
            </div>
          </div>
        </div>
      }
    >
      <ShopContent products={products} categories={categories} collections={collections} regions={regions} loadError={loadError} />
    </Suspense>
  );
}
