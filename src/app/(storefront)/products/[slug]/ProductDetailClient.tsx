"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Check,
  Truck,
  RotateCcw,
  Star,
  Play,
  Copy,
  MessageCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { ProductItem } from "@/lib/sample-data";
import { SAMPLE_PRODUCTS } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/shop/ProductCard";
import { getSellableStock, isVariantAvailable } from "@/lib/inventory";

interface ProductPageProps {
  product: ProductItem;
  relatedProducts: ProductItem[];
  reviews: { id: string; author: string; rating: number; date: string; verified: boolean; title: string; comment: string }[];
  canReview: boolean;
}

export default function ProductDetailPage({ product, relatedProducts, reviews: initialReviews, canReview }: ProductPageProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist, wishlistReady } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [unavailableImages, setUnavailableImages] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Free Size");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "Standard");
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState("");
  const [showVideo, setShowVideo] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"STORY" | "FABRIC" | "CARE" | "SHIPPING">("STORY");

  // Lightbox full-screen textile inspection state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  // Mobile swipe gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Recently viewed products
  const [recentlyViewed, setRecentlyViewed] = useState<ProductItem[]>([]);

  // Reviews state
  const [reviews] = useState(initialReviews);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewNotice, setReviewNotice] = useState("");

  const isFavorited = isInWishlist(product.id);
  const sampleProduct = SAMPLE_PRODUCTS.find((p) => p.slug === product.slug || p.id === product.id);
  const resolvedImages = (product.images && product.images.length > 0 && !product.images[0].includes("images.unsplash.com"))
    ? product.images
    : (sampleProduct?.images || product.images || []);
  const primaryImage = resolvedImages[0] || "";
  const savingsAmount = product.mrp > product.price ? product.mrp - product.price : 0;
  const hasVariants = Boolean(product.variants?.length);
  const selectedVariant = product.variants?.find((variant) => variant.size === selectedSize && variant.color === selectedColor);
  const selectedVariantAvailable = selectedVariant ? isVariantAvailable(product, selectedVariant.id) : !hasVariants && getSellableStock(product) > 0;
  const availableStock = selectedVariantAvailable ? selectedVariant?.stock ?? getSellableStock(product) : 0;
  const canAddSelectedItem = Boolean(selectedVariantAvailable && Number.isInteger(availableStock) && availableStock > 0);
  const colorAvailable = (color: string) => !hasVariants || Boolean(product.variants?.some((variant) => variant.color === color && isVariantAvailable(product, variant.id)));
  const sizeAvailable = (size: string) => !hasVariants || Boolean(product.variants?.some((variant) => variant.size === size && isVariantAvailable(product, variant.id)));

  // Size guidance categories
  const isGarmentWithSizes =
    ["kurtas", "lehengas", "mens-ethnic-wear"].includes(product.category) ||
    product.sizes.some((s) => ["XS", "S", "M", "L", "XL", "XXL", "38", "40", "42", "44"].includes(s.trim().toUpperCase()));
  const isSaree = product.category === "sarees" || product.title.toLowerCase().includes("saree");
  const isShawlOrStole = product.category === "accessories" || product.title.toLowerCase().includes("shawl") || product.title.toLowerCase().includes("stole");

  // Sync recently viewed in localStorage
  useEffect(() => {
    try {
      const STORAGE_KEY = "preheritage_recent_views_v1";
      const raw = localStorage.getItem(STORAGE_KEY);
      const stored: ProductItem[] = raw ? JSON.parse(raw) : [];
      const others = stored.filter((item) => item.id !== product.id && item.slug !== product.slug);
      setRecentlyViewed(others.slice(0, 4));

      const updated = [product, ...others].slice(0, 8);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // localStorage fallback
    }
  }, [product]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50 && resolvedImages.length > 1) {
      setActiveImageIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1));
      setShowVideo(false);
    } else if (distance < -50 && resolvedImages.length > 1) {
      setActiveImageIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1));
      setShowVideo(false);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    setQuantity((current) => canAddSelectedItem ? Math.max(1, Math.min(current, availableStock)) : 1);
  }, [availableStock, canAddSelectedItem]);

  // Keyboard navigation for full-screen inspection lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setIsZoomedIn(false);
      } else if (e.key === "ArrowLeft" && resolvedImages.length > 1) {
        setActiveImageIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1));
        setIsZoomedIn(false);
      } else if (e.key === "ArrowRight" && resolvedImages.length > 1) {
        setActiveImageIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1));
        setIsZoomedIn(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, resolvedImages.length]);

  const handleAddToCart = () => {
    const result = addToCart(product, selectedSize, selectedColor, quantity);
    setCartNotice(result.success ? "Added to your Heritage Bag." : result.message || "This selection could not be added.");
  };

  const handleBuyNow = () => {
    const result = addToCart(product, selectedSize, selectedColor, quantity);
    if (result.success) router.push("/checkout");
    else setCartNotice(result.message || "This selection could not be added.");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewNotice("");
    try {
      const response = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newReviewRating, comment: newReviewComment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Your review could not be submitted.");
      setNewReviewComment("");
      setReviewNotice("Thank you. Your verified-purchase review has been sent for moderation.");
    } catch (error) {
      setReviewNotice(error instanceof Error ? error.message : "Your review could not be submitted.");
    }
  };

  return (
    <div className="min-h-screen bg-ivory-100 pb-24 pt-6 sm:pb-20 sm:pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 text-[10px] font-medium uppercase tracking-[.14em] text-charcoal-500 sm:text-xs">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">Home</Link> /{" "}
          <Link href="/shop" className="hover:text-charcoal-900 transition-colors">Collections</Link> /{" "}
          <Link href={`/shop?category=${product.category}`} className="hover:text-charcoal-900 capitalize transition-colors">
            {product.category}
          </Link>{" "}
          / <span aria-current="page" className="text-charcoal-900">{product.title}</span>
        </nav>

        {/* Top Product View: Gallery (Left) & Purchasing Info (Right) */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-14">
          {/* Gallery Showcase */}
          <div className={`flex flex-col-reverse gap-3 ${resolvedImages.length > 1 ? "sm:flex-row" : ""} lg:col-span-7 lg:gap-4 lg:sticky lg:top-40`}>
            {/* Thumbnails (only render if multiple authentic images exist) */}
            {resolvedImages.length > 1 && (
              <div aria-label="Product media" className="flex gap-2 overflow-x-auto sm:w-[76px] sm:flex-col sm:overflow-y-auto">
                {resolvedImages.map((img, idx) => (
                  <button
                    key={idx}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={activeImageIndex === idx && !showVideo}
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setShowVideo(false);
                    }}
                    className={`relative aspect-[4/5] w-[58px] shrink-0 overflow-hidden border transition-all sm:w-full ${
                      activeImageIndex === idx && !showVideo
                        ? "border-gold-600 shadow-sm"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    {unavailableImages.includes(img) ? (
                      <span className="grid h-full place-items-center font-serif font-bold text-gold-700">PH</span>
                    ) : (
                      <Image
                        src={img}
                        alt={`${product.title} thumbnail ${idx + 1}`}
                        fill
                        unoptimized={img.startsWith("/api/storage/")}
                        onError={() => setUnavailableImages((current) => current.includes(img) ? current : [...current, img])}
                        className="object-cover"
                      />
                    )}
                  </button>
                ))}

                {product.videoUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    aria-label="Play product video"
                    aria-pressed={showVideo}
                    className={`relative aspect-[4/5] w-[58px] shrink-0 flex-col items-center justify-center border text-gold-400 sm:flex sm:w-full ${showVideo ? "flex" : "hidden sm:flex"} ${
                      showVideo ? "border-gold-600" : "border-transparent"
                    }`}
                  >
                    <Play className="w-5 h-5" />
                    <span className="text-[9px] uppercase tracking-wider font-semibold mt-1">Video</span>
                  </button>
                )}
              </div>
            )}

            {/* Main Image Frame with Click-to-Zoom & Mobile Swipe */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => !showVideo && setIsLightboxOpen(true)}
              className={`group relative aspect-[4/5] min-w-0 flex-1 overflow-hidden bg-ivory-200 border border-ivory-300 rounded-xs select-none ${
                !showVideo ? "cursor-zoom-in" : ""
              }`}
            >
              {showVideo && product.videoUrl ? (
                <video
                  src={product.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : resolvedImages[activeImageIndex] && !unavailableImages.includes(resolvedImages[activeImageIndex]) ? (
                <Image
                  src={resolvedImages[activeImageIndex] || primaryImage}
                  alt={product.title}
                  fill
                  priority
                  unoptimized={resolvedImages[activeImageIndex]?.startsWith("/api/storage/")}
                  onError={() => setUnavailableImages((current) => current.includes(resolvedImages[activeImageIndex]) ? current : [...current, resolvedImages[activeImageIndex]])}
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-serif text-5xl text-gold-700">PH</div>
              )}

              {/* Inspect Weave Overlay Button */}
              {!showVideo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  aria-label="Inspect textile weave in full screen"
                  className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-xs bg-charcoal-950/80 px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase text-ivory-100 backdrop-blur-sm transition-all hover:bg-charcoal-900 hover:text-white"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-gold-400" />
                  <span>Inspect Weave</span>
                </button>
              )}

              {/* Wishlist Button on Image */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                disabled={!wishlistReady}
                className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ivory-50/95 text-charcoal-800 transition-colors hover:text-heritage-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 sm:right-5 sm:top-5"
                aria-label={isFavorited ? "Remove from wishlist" : "Save to wishlist"}
                aria-pressed={isFavorited}
                aria-busy={!wishlistReady}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorited ? "text-heritage-crimson fill-heritage-crimson" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Product Purchasing Info */}
          <div className="min-w-0 border-t border-ivory-300 pt-7 lg:col-span-5 lg:border-t-0 lg:pt-0">
            <div>
              {/* Region & SKU */}
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[.2em] text-gold-800">
                <span>{product.state || product.region}</span>
                {product.badge && <span className="border-l border-ivory-400 pl-3">{product.badge.replaceAll("_", " ")}</span>}
              </div>

              {/* Title */}
              <h1 className="max-w-[18ch] font-serif text-3xl font-normal leading-[1.04] text-charcoal-900 sm:text-4xl lg:text-5xl">
                {product.title}
              </h1>

              {/* Ratings / Artisan Verification Badge */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-ivory-300 pb-4 text-xs">
                {product.reviewCount > 0 ? (
                  <>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(product.rating) ? "fill-amber-500" : "text-ivory-400"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-charcoal-800">{product.rating}</span>
                    <a
                      href="#customer-reviews"
                      className="text-charcoal-600 underline decoration-ivory-400 underline-offset-4 hover:text-gold-800"
                    >
                      {product.reviewCount} customer reviews
                    </a>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-700 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-600" />
                    <span>Vault Edition · Single-Loom Verified Provenance</span>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-serif text-3xl font-medium text-charcoal-900 sm:text-4xl">
                  {formatPrice(product.price)}
                </span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-sm text-charcoal-100 line-through">
                      MRP {formatPrice(product.mrp)}
                    </span>
                    <span className="border-l border-ivory-400 pl-3 text-xs font-medium text-gold-800">
                      Save {formatPrice(savingsAmount)} ({product.discount}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] text-charcoal-500">
                Inclusive of all taxes. Free insured courier dispatch across India.
              </p>

              {/* Color Selector */}
              <div className="mt-6">
                <div className="text-xs uppercase tracking-wider font-semibold text-charcoal-800 mb-2">
                  Heritage Shade: <span className="font-normal text-charcoal-200">{selectedColor}</span>
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      disabled={!colorAvailable(c.name)}
                      aria-pressed={selectedColor === c.name}
                      onClick={() => { setSelectedColor(c.name); setCartNotice(""); }}
                      className={`group relative inline-flex min-h-10 items-center gap-2 border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        selectedColor === c.name
                          ? "border-charcoal-900 bg-charcoal-900 text-ivory-50 font-medium"
                          : "border-ivory-400 bg-ivory-50 text-charcoal-800 hover:border-gold-600"
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector & Size Chart (Relevant Products Only) */}
              {isSaree ? (
                <div className="mt-6 rounded-xs bg-ivory-50 p-3.5 border border-ivory-300">
                  <div className="flex items-center justify-between text-xs text-charcoal-800">
                    <span className="font-semibold uppercase tracking-wider text-charcoal-900">Drape Dimensions:</span>
                    <span className="font-medium text-gold-800">6.3 Metres Total</span>
                  </div>
                  <p className="text-[11px] text-charcoal-500 mt-1 font-light leading-relaxed">
                    Includes 5.5m pure handloom drape and 0.8m unstitched matching blouse fabric. Universal drape fit for all silhouettes.
                  </p>
                </div>
              ) : isShawlOrStole ? (
                <div className="mt-6 rounded-xs bg-ivory-50 p-3.5 border border-ivory-300">
                  <div className="flex items-center justify-between text-xs text-charcoal-800">
                    <span className="font-semibold uppercase tracking-wider text-charcoal-900">Heirloom Dimensions:</span>
                    <span className="font-medium text-gold-800">200 cm × 100 cm</span>
                  </div>
                  <p className="text-[11px] text-charcoal-500 mt-1 font-light leading-relaxed">
                    Full-length artisanal wrap woven from pure Himalayan cashmere.
                  </p>
                </div>
              ) : product.sizes && product.sizes.length > 0 ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-charcoal-800 mb-2">
                    <span>Select Size</span>
                    {isGarmentWithSizes && (
                      <button
                        type="button"
                        onClick={() => setIsSizeChartOpen(true)}
                        className="text-gold-700 hover:text-gold-900 underline text-[11px] font-medium"
                      >
                        Size & Fit Guidance
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        disabled={!sizeAvailable(size)}
                        aria-pressed={selectedSize === size}
                        onClick={() => { setSelectedSize(size); setCartNotice(""); }}
                        className={`min-h-11 min-w-12 border px-3 py-2 text-xs font-semibold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          selectedSize === size
                            ? "border-charcoal-900 bg-charcoal-900 text-ivory-50"
                            : "border-ivory-400 bg-ivory-50 text-charcoal-800 hover:border-gold-600"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Quantity & Stock Availability Alert */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-charcoal-800 font-semibold">Quantity:</span>
                  <div className="flex items-center border border-ivory-300 rounded bg-white">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={!canAddSelectedItem || quantity <= 1}
                      className="inline-flex h-11 w-11 items-center justify-center text-lg text-charcoal-500 hover:text-charcoal-900 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span aria-live="polite" className="min-w-8 text-center text-sm font-semibold text-charcoal-900">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                      disabled={!canAddSelectedItem || quantity >= availableStock}
                      className="inline-flex h-11 w-11 items-center justify-center text-lg text-charcoal-500 hover:text-charcoal-900 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Stock Status Indicator */}
                <div role="status" className="text-right">
                  {canAddSelectedItem ? (
                    availableStock > 5 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span>In Stock · Ready for Dispatch</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
                        <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                        <span>Only {availableStock} Left in Atelier</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-500">
                      <span className="h-2 w-2 rounded-full bg-charcoal-400"></span>
                      <span>Currently Reserved · Restock in Progress</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Add to Cart & Buy Now */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddSelectedItem}
                  className="flex min-h-14 w-full items-center justify-center gap-2 bg-charcoal-900 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-ivory-50 transition-colors hover:bg-[#39312A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:bg-charcoal-300"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{cartNotice.startsWith("Added") ? "Added to bag" : "Add to bag"}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={!canAddSelectedItem}
                  className="flex min-h-12 w-full items-center justify-center gap-2 border border-charcoal-900 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-900 transition-colors hover:bg-ivory-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:border-ivory-400 disabled:text-charcoal-400"
                >
                  <span>Buy now</span>
                </button>
                {cartNotice && <p role="status" className="text-xs text-charcoal-600" aria-live="polite">{cartNotice}</p>}
              </div>

              {/* Trust & Dispatch Highlights */}
              <div className="mt-7 grid grid-cols-2 gap-3 border-y border-ivory-300 py-4 text-xs text-charcoal-700">
                <Link href="/shipping-policy" className="flex min-h-14 items-center gap-2 transition-colors hover:text-gold-800">
                  <Truck className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-charcoal-900">Complimentary Shipping</span>
                    <span className="text-[11px] text-charcoal-500">Insured delivery across India</span>
                  </div>
                </Link>

                <Link href="/return-policy" className="flex min-h-14 items-center gap-2 transition-colors hover:text-gold-800">
                  <RotateCcw className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-charcoal-900">7-Day Heirloom Returns</span>
                    <span className="text-[11px] text-charcoal-500">Review the return policy</span>
                  </div>
                </Link>
              </div>

              {/* Share section */}
              <div className="mt-5 flex items-center justify-between text-xs text-charcoal-500">
                <span className="font-medium text-charcoal-700">Share this piece</span>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://wa.me/?text=Check%20out%20this%20rare%20piece%20from%20PREHERITAGE:%20${encodeURIComponent(product.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Share product on WhatsApp"
                    className="inline-flex h-10 w-10 items-center justify-center hover:text-emerald-700 transition-colors"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <button
                    onClick={handleCopyLink}
                    aria-label="Copy product link"
                    className="inline-flex min-h-10 items-center gap-2 hover:text-charcoal-900 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Storytelling Section */}
        <section className="mt-14 border-y border-ivory-300 bg-ivory-50 px-5 py-8 sm:px-10 sm:py-10">
          {/* Tab Navigation */}
          <div role="tablist" aria-label="Product information" className="flex gap-6 overflow-x-auto border-b border-ivory-300 text-[10px] font-semibold uppercase tracking-[.16em] sm:gap-10 sm:text-xs">
            <button
              onClick={() => setActiveTab("STORY")}
              role="tab"
              id="product-story-tab"
              aria-controls="product-info-panel"
              aria-selected={activeTab === "STORY"}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "STORY"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-100 hover:text-charcoal-900"
              }`}
            >
              Cultural Origin & Story
            </button>
            <button
              onClick={() => setActiveTab("FABRIC")}
              role="tab"
              id="product-fabric-tab"
              aria-controls="product-info-panel"
              aria-selected={activeTab === "FABRIC"}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "FABRIC"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-100 hover:text-charcoal-900"
              }`}
            >
              Fabric & Weaving Technique
            </button>
            <button
              onClick={() => setActiveTab("CARE")}
              role="tab"
              id="product-care-tab"
              aria-controls="product-info-panel"
              aria-selected={activeTab === "CARE"}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "CARE"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-100 hover:text-charcoal-900"
              }`}
            >
              Heirloom Care Guide
            </button>
            <button
              onClick={() => setActiveTab("SHIPPING")}
              role="tab"
              id="product-shipping-tab"
              aria-controls="product-info-panel"
              aria-selected={activeTab === "SHIPPING"}
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "SHIPPING"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-100 hover:text-charcoal-900"
              }`}
            >
              Shipping & Returns
            </button>
          </div>

          {/* Tab Content */}
          <div id="product-info-panel" role="tabpanel" aria-labelledby={`product-${activeTab.toLowerCase()}-tab`} className="max-w-3xl py-7 text-sm leading-7 text-charcoal-700">
            {activeTab === "STORY" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif text-2xl font-medium text-charcoal-900 sm:text-3xl">
                  The story behind this piece
                </h3>
                <p>{product.culturalStory}</p>
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === "FABRIC" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif text-2xl font-medium text-charcoal-900 sm:text-3xl">
                  Materials & fit
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="border-t border-ivory-300 py-4">
                    <span className="font-semibold text-charcoal-900 block mb-1">Fabric Composition</span>
                    <span>{product.fabricDetails}</span>
                  </div>
                  <div className="border-t border-ivory-300 py-4">
                    <span className="font-semibold text-charcoal-900 block mb-1">Dimensions & Fit</span>
                    <span>{product.sizeFitGuide}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "CARE" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif text-2xl font-medium text-charcoal-900 sm:text-3xl">
                  Care instructions
                </h3>
                <p>{product.careInstructions}</p>
              </div>
            )}

            {activeTab === "SHIPPING" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif text-2xl font-medium text-charcoal-900 sm:text-3xl">
                  Shipping & returns
                </h3>
                <p>Complimentary insured express delivery across all pin codes in India. International orders dispatched via DHL Express with tracked door-to-door transit.</p>
                <div className="flex flex-wrap gap-5 text-xs font-semibold uppercase tracking-widest mt-4">
                  <Link href="/shipping-policy" className="border-b border-gold-600 pb-1 text-charcoal-900 hover:text-gold-800">Shipping policy</Link>
                  <Link href="/return-policy" className="border-b border-gold-600 pb-1 text-charcoal-900 hover:text-gold-800">Return policy</Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section id="customer-reviews" className="mt-12 scroll-mt-32 border-y border-ivory-300 bg-ivory-50 px-5 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-ivory-300 gap-4">
            <div>
              <h3 className="font-serif text-2xl font-medium text-charcoal-900 sm:text-3xl">
                Customer reviews
              </h3>
              <p className="text-xs text-charcoal-100 mt-1">
                Published reviews for this product
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-serif font-bold text-charcoal-900">{product.rating}</div>
              <div>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? "fill-amber-500" : "text-ivory-400"}`} />
                  ))}
                </div>
                <div className="text-[11px] text-charcoal-100">Based on {reviews.length} reviews</div>
              </div>
            </div>
          </div>

          {/* Existing reviews */}
          <div className="divide-y divide-ivory-200 py-6 space-y-6">
            {reviews.length === 0 && <p className="text-sm text-charcoal-400">There are no approved reviews for this piece yet.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="pt-6 first:pt-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-charcoal-900">{r.author}</span>
                    {r.verified && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-charcoal-100">{r.date}</span>
                </div>
                <div className="flex text-amber-500 mb-2">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-500" />
                  ))}
                </div>
                <h4 className="font-serif text-sm font-semibold text-charcoal-900 mb-1">{r.title}</h4>
                <p className="text-xs text-charcoal-200 leading-relaxed font-light">{r.comment}</p>
              </div>
            ))}
          </div>

          {/* Add a Review Form */}
          <div className="mt-8 pt-6 border-t border-ivory-300">
            <h4 className="font-serif text-lg font-bold text-charcoal-900 mb-3">
              Write a Review
            </h4>
            {reviewNotice && <p role="status" className="mb-3 max-w-xl text-xs text-charcoal-600">{reviewNotice}</p>}
            {canReview ? (
              <form onSubmit={handleAddReview} className="space-y-4 max-w-xl">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block mb-1">
                    Rating
                  </label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="bg-white border border-ivory-300 px-3 py-2 text-xs rounded focus:outline-none focus:border-gold-500"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block mb-1">
                    Your Review
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Share details regarding the fabric weight, embroidery finishing, and drape..."
                    className="w-full bg-white border border-ivory-300 px-3 py-2 text-xs rounded focus:outline-none focus:border-gold-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold transition-colors rounded"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <p className="text-xs text-charcoal-500">
                <Link className="font-semibold text-gold-800 underline" href={`/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`}>
                  Sign in
                </Link>{" "}
                with your account to review this product after delivery.
              </p>
            )}
          </div>
        </section>

        {/* Related Heritage Creations */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-xs uppercase tracking-[0.24em] text-gold-600 font-semibold font-sans block mb-1">
                  From the collection
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
                  Related pieces
                </h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Add-to-Bag Bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-ivory-300 bg-ivory-50/95 p-3.5 backdrop-blur-md shadow-2xl sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {primaryImage && (
              <div className="relative aspect-[4/5] w-10 shrink-0 overflow-hidden rounded-xs border border-ivory-300">
                <Image src={primaryImage} alt="" fill unoptimized={primaryImage.startsWith("/api/storage/")} className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-charcoal-900">{product.title}</p>
              <p className="font-serif text-sm font-semibold text-charcoal-900">{formatPrice(product.price)}</p>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!canAddSelectedItem}
            aria-label={cartNotice.startsWith("Added") ? "Added to bag" : "Quick reserve to bag"}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xs bg-charcoal-900 px-5 text-xs font-semibold uppercase tracking-wider text-ivory-50 transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:bg-charcoal-300"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{cartNotice.startsWith("Added") ? "Added" : "Quick Reserve"}</span>
          </button>
        </div>
      </div>

      {/* Full-Screen Textile Weave Inspection Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-charcoal-950/95 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Textile weave inspection modal"
        >
          {/* Top Header Bar */}
          <div className="flex w-full max-w-6xl items-center justify-between border-b border-charcoal-800/80 pb-4 text-ivory-100">
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-gold-400 font-semibold block">
                Textile Weave &amp; Craft Inspection
              </span>
              <h2 className="font-serif text-lg sm:text-xl text-ivory-50 mt-0.5">
                {product.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Zoom Toggle */}
              <button
                onClick={() => setIsZoomedIn(!isZoomedIn)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xs border border-charcoal-700 bg-charcoal-900/90 px-3.5 py-2 text-xs font-medium text-ivory-100 hover:border-gold-500 hover:text-gold-300 transition-colors"
                aria-label={isZoomedIn ? "Fit image to window" : "Zoom in 2x for macro weave inspection"}
              >
                {isZoomedIn ? (
                  <>
                    <ZoomOut className="w-4 h-4 text-gold-400" />
                    <span className="hidden sm:inline">Fit to Screen</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4 text-gold-400" />
                    <span className="hidden sm:inline">2x Macro Zoom</span>
                  </>
                )}
              </button>

              {/* Close Modal Button */}
              <button
                onClick={() => {
                  setIsLightboxOpen(false);
                  setIsZoomedIn(false);
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xs border border-charcoal-700 bg-charcoal-900/90 text-ivory-100 hover:border-gold-500 hover:text-gold-300 transition-colors"
                aria-label="Close image inspection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Image Stage */}
          <div className="relative flex flex-1 w-full max-w-5xl items-center justify-center overflow-hidden py-4">
            {/* Previous Image Arrow */}
            {resolvedImages.length > 1 && (
              <button
                onClick={() => {
                  setActiveImageIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1));
                  setIsZoomedIn(false);
                }}
                className="absolute left-2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-charcoal-900/80 text-ivory-100 backdrop-blur-sm border border-charcoal-700 hover:border-gold-500 hover:text-gold-300 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Viewport Frame */}
            <div
              onClick={() => setIsZoomedIn(!isZoomedIn)}
              className={`relative max-h-[75vh] w-full max-w-3xl aspect-[4/5] overflow-hidden rounded-xs cursor-${isZoomedIn ? "zoom-out" : "zoom-in"} transition-all duration-300`}
            >
              {resolvedImages[activeImageIndex] && (
                <Image
                  src={resolvedImages[activeImageIndex]}
                  alt={`${product.title} - view ${activeImageIndex + 1}`}
                  fill
                  unoptimized={resolvedImages[activeImageIndex]?.startsWith("/api/storage/")}
                  className={`object-contain transition-transform duration-500 ${isZoomedIn ? "scale-175 cursor-zoom-out" : "scale-100 cursor-zoom-in"}`}
                  sizes="100vw"
                  priority
                />
              )}
            </div>

            {/* Next Image Arrow */}
            {resolvedImages.length > 1 && (
              <button
                onClick={() => {
                  setActiveImageIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1));
                  setIsZoomedIn(false);
                }}
                className="absolute right-2 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-charcoal-900/80 text-ivory-100 backdrop-blur-sm border border-charcoal-700 hover:border-gold-500 hover:text-gold-300 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer Strip: Caption & Thumbnails */}
          <div className="flex w-full max-w-4xl flex-col items-center gap-3 pt-2">
            <p className="text-center text-xs text-charcoal-400 font-light">
              Image {activeImageIndex + 1} of {resolvedImages.length} · {activeImageIndex === 0 ? "Primary Studio View" : "Intricate Zari Pallu & Weave Macro"}
            </p>

            {resolvedImages.length > 1 && (
              <div className="flex items-center gap-2">
                {resolvedImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setIsZoomedIn(false);
                    }}
                    className={`relative aspect-[4/5] w-12 overflow-hidden rounded-xs border transition-all ${
                      activeImageIndex === idx
                        ? "border-gold-500 shadow-md ring-1 ring-gold-500"
                        : "border-charcoal-700 opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <Image src={img} alt="" fill unoptimized={img.startsWith("/api/storage/")} className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Size Chart Modal */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/70 p-4 backdrop-blur-sm" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setIsSizeChartOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="size-guide-title" className="w-full max-w-lg border border-ivory-300 bg-ivory-50 p-6 sm:p-8">
            <div className="flex justify-between items-center pb-4 border-b border-ivory-300 mb-4">
              <h3 id="size-guide-title" className="font-serif text-2xl font-medium text-charcoal-900">Size & fit</h3>
              <button
                onClick={() => setIsSizeChartOpen(false)}
                aria-label="Close size guide"
                className="inline-flex h-10 w-10 items-center justify-center text-charcoal-500 hover:text-charcoal-900"
              >
                ✕
              </button>
            </div>
            <div className="space-y-5 text-sm leading-6 text-charcoal-700">
              <p>{product.sizeFitGuide || "Please contact us for size and fit guidance."}</p>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-charcoal-500">Available options</p>
                <div className="flex flex-wrap gap-2">{product.sizes.map((size) => <span key={size} className="border border-ivory-400 px-3 py-2 text-xs font-medium text-charcoal-800">{size}</span>)}</div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
