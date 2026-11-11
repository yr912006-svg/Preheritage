"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Sparkles,
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
  const { addToCart, updateCartItemImage, cart } = useCart();
  const { toggleWishlist, isInWishlist, wishlistReady } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [unavailableImages, setUnavailableImages] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Standard");
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
  const sampleProduct = useMemo(
    () => SAMPLE_PRODUCTS.find((p) => p.slug === product.slug || p.id === product.id),
    [product.slug, product.id]
  );
  const resolvedImages = useMemo(() => {
    return (product.images && product.images.length > 0 && !product.images[0].includes("images.unsplash.com"))
      ? product.images
      : (sampleProduct?.images || product.images || []);
  }, [product.images, sampleProduct]);
  const primaryImage = resolvedImages[0] || "";

  const hasVariants = Boolean(product.variants?.length);
  const selectedVariant = product.variants?.find((variant) => variant.size === selectedSize && variant.color === selectedColor);
  const selectedVariantAvailable = selectedVariant ? isVariantAvailable(product, selectedVariant.id) : !hasVariants && getSellableStock(product) > 0;
  const availableStock = selectedVariantAvailable ? selectedVariant?.stock ?? getSellableStock(product) : 0;
  const canAddSelectedItem = Boolean(selectedVariantAvailable && Number.isInteger(availableStock) && availableStock > 0);
  const colorAvailable = (color: string) => !hasVariants || Boolean(product.variants?.some((variant) => variant.color === color && isVariantAvailable(product, variant.id)));
  const sizeAvailable = (size: string) => !hasVariants || Boolean(product.variants?.some((variant) => variant.size === size && isVariantAvailable(product, variant.id)));

  // Pricing calculation strictly aligned with database values
  const unitPrice = Number(product.price) + Number(selectedVariant?.additionalPrice || 0);
  const unitMrp = Number(product.mrp) > 0 ? Number(product.mrp) + Number(selectedVariant?.additionalPrice || 0) : unitPrice;
  const savingsAmount = unitMrp > unitPrice ? unitMrp - unitPrice : 0;
  const discountPercent = product.discount || (unitMrp > unitPrice ? Math.round(((unitMrp - unitPrice) / unitMrp) * 100) : 0);

  // Size guidance categories
  const isGarmentWithSizes =
    ["kurtas", "lehengas", "mens-ethnic-wear"].includes(product.category) ||
    product.sizes.some((s) => ["XS", "S", "M", "L", "XL", "XXL", "38", "40", "42", "44"].includes(s.trim().toUpperCase()));

  // Verified color-to-image mapping against actual variant and image filenames/slugs
  const findImageForColor = (colorName: string): number => {
    if (!colorName || !resolvedImages.length) return 0;
    const normalizedColor = colorName.toLowerCase().trim();
    const slugColor = normalizedColor.replace(/\s+/g, "-");

    // 1. Check if any image URL matches the color slug or name
    const matchByUrl = resolvedImages.findIndex((img) => {
      const lower = img.toLowerCase();
      return (
        lower.includes(`-${slugColor}`) ||
        lower.includes(`_${slugColor}`) ||
        lower.includes(slugColor) ||
        lower.includes(normalizedColor)
      );
    });
    if (matchByUrl >= 0) return matchByUrl;

    // 2. If the product variants have a direct 1:1 image array correspondence
    if (product.colors && product.colors.length === resolvedImages.length) {
      const colorIndex = product.colors.findIndex((c) => c.name.toLowerCase() === normalizedColor);
      if (colorIndex >= 0 && colorIndex < resolvedImages.length) {
        return colorIndex;
      }
    }

    // 3. Fallback: preserve current active image rather than assigning an unrelated index
    return activeImageIndex;
  };

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
    const selectedImage = resolvedImages[activeImageIndex] || primaryImage;
    const result = addToCart(product, selectedSize, selectedColor, quantity, selectedImage);
    setCartNotice(result.success ? "Added to your Heritage Bag." : result.message || "This selection could not be added.");
  };

  const handleBuyNow = () => {
    const selectedImage = resolvedImages[activeImageIndex] || primaryImage;
    const result = addToCart(product, selectedSize, selectedColor, quantity, selectedImage);
    if (result.success) router.push("/checkout");
    else setCartNotice(result.message || "This selection could not be added.");
  };

  // Synchronize cart item image if this product or variant is in the bag
  useEffect(() => {
    const currentImage = resolvedImages[activeImageIndex] || primaryImage;
    if (!currentImage) return;
    const currentItemId = `${product.id}-${selectedSize}-${selectedColor}`;
    const cartItem = cart.find(
      (item) => item.id === currentItemId || (item.productId === product.id && item.size === selectedSize && item.color === selectedColor)
    );
    if (cartItem && cartItem.image !== currentImage) {
      updateCartItemImage(cartItem.id, currentImage);
    }
  }, [activeImageIndex, selectedSize, selectedColor, resolvedImages, primaryImage, product.id, cart, updateCartItemImage]);

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-ivory-100 pb-28 pt-6 sm:pb-24 sm:pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 text-[10px] font-medium uppercase tracking-[.16em] text-charcoal-500 sm:text-xs">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">Home</Link>
          <span className="mx-2 text-charcoal-300">/</span>
          <Link href="/shop" className="hover:text-charcoal-900 transition-colors">Collections</Link>
          <span className="mx-2 text-charcoal-300">/</span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-charcoal-900 capitalize transition-colors">
            {product.category}
          </Link>
          <span className="mx-2 text-charcoal-300">/</span>
          <span aria-current="page" className="text-charcoal-900 font-semibold">{product.title}</span>
        </nav>

        {/* Top Product View: Gallery (Left) & Purchasing Info (Right) */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-14">
          {/* Gallery Showcase */}
          <div className={`flex flex-col-reverse gap-3 ${resolvedImages.length > 1 ? "sm:flex-row" : ""} lg:col-span-7 lg:gap-4 lg:sticky lg:top-40`}>
            {/* Thumbnails */}
            {resolvedImages.length > 1 && (
              <div aria-label="Product media thumbnails" className="flex gap-2.5 overflow-x-auto pb-1 sm:w-[76px] sm:flex-col sm:overflow-y-auto sm:pb-0">
                {resolvedImages.map((img, idx) => (
                  <button
                    key={idx}
                    aria-label={`View image ${idx + 1}`}
                    aria-pressed={activeImageIndex === idx && !showVideo}
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setShowVideo(false);
                    }}
                    className={`relative aspect-[4/5] w-[58px] shrink-0 overflow-hidden border transition-all sm:w-full rounded-xs ${
                      activeImageIndex === idx && !showVideo
                        ? "border-[#B08A45] shadow-sm ring-1 ring-[#B08A45]"
                        : "border-ivory-300 opacity-70 hover:opacity-100 hover:border-gold-500"
                    }`}
                  >
                    {unavailableImages.includes(img) ? (
                      <span className="grid h-full place-items-center font-serif font-bold text-gold-700 text-xs">PH</span>
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
                    className={`relative aspect-[4/5] w-[58px] shrink-0 flex-col items-center justify-center border text-gold-500 sm:flex sm:w-full rounded-xs ${showVideo ? "flex" : "hidden sm:flex"} ${
                      showVideo ? "border-[#B08A45] bg-[#24201D]" : "border-ivory-300 hover:border-gold-500"
                    }`}
                  >
                    <Play className="w-5 h-5 text-gold-400" />
                    <span className="text-[9px] uppercase tracking-wider font-semibold mt-1">Video</span>
                  </button>
                )}
              </div>
            )}

            {/* Main Image Frame with Zoom, Navigation Arrows, and Swipe */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => !showVideo && setIsLightboxOpen(true)}
              className={`group relative aspect-[4/5] min-w-0 flex-1 overflow-hidden bg-ivory-200 border border-ivory-300 rounded-xs select-none shadow-luxury ${
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

              {/* Image Counter Badge */}
              {resolvedImages.length > 1 && !showVideo && (
                <span className="absolute top-3 left-3 z-10 rounded-xs bg-[#24201D]/75 px-2.5 py-1 text-[10px] font-medium tracking-wider text-[#FAF8F5] backdrop-blur-xs">
                  {activeImageIndex + 1} / {resolvedImages.length}
                </span>
              )}

              {/* Carousel Arrows on Desktop/Laptop Frame */}
              {resolvedImages.length > 1 && !showVideo && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? resolvedImages.length - 1 : prev - 1));
                    }}
                    aria-label="Previous product image"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF8F5]/90 text-[#24201D] shadow-sm backdrop-blur-xs border border-stone-200 transition-all opacity-0 group-hover:opacity-100 hover:bg-white hover:text-[#B08A45]"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === resolvedImages.length - 1 ? 0 : prev + 1));
                    }}
                    aria-label="Next product image"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF8F5]/90 text-[#24201D] shadow-sm backdrop-blur-xs border border-stone-200 transition-all opacity-0 group-hover:opacity-100 hover:bg-white hover:text-[#B08A45]"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Mobile Dot Indicators */}
              {resolvedImages.length > 1 && !showVideo && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 sm:hidden">
                  {resolvedImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(idx);
                      }}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImageIndex === idx ? "w-5 bg-[#B08A45]" : "w-1.5 bg-[#FAF8F5]/70"
                      }`}
                    />
                  ))}
                </div>
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
                  className="absolute bottom-3 left-3 hidden sm:inline-flex items-center gap-1.5 rounded-xs bg-charcoal-950/80 px-3 py-1.5 text-[10px] font-medium tracking-wider uppercase text-ivory-100 backdrop-blur-sm transition-all hover:bg-charcoal-900 hover:text-white"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-gold-400" />
                  <span>Inspect Weave</span>
                </button>
              )}

              {/* Wishlist Button on Image */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWishlist(product);
                }}
                disabled={!wishlistReady}
                className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-ivory-50/95 text-charcoal-800 transition-all hover:text-heritage-crimson hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 sm:right-5 sm:top-5 shadow-sm border border-stone-200"
                aria-label={isFavorited ? "Remove from wishlist" : "Save to wishlist"}
                aria-pressed={isFavorited}
                aria-busy={!wishlistReady}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isFavorited ? "text-heritage-crimson fill-heritage-crimson" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Product Purchasing Info Panel */}
          <div className="min-w-0 border-t border-ivory-300 pt-7 lg:col-span-5 lg:border-t-0 lg:pt-0">
            <div>
              {/* Region & Badges */}
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[.24em] text-gold-800">
                <span>{product.state || product.region || "Indian Heritage"}</span>
                {product.badge && (
                  <span className="border-l border-ivory-400 pl-3 text-[#24201D]">
                    {product.badge.replaceAll("_", " ")}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="max-w-[20ch] font-serif text-3xl font-normal leading-[1.08] text-charcoal-900 sm:text-4xl lg:text-[40px]">
                {product.title}
              </h1>

              {/* Patron Rating & Provenance */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-b border-ivory-300 pb-4 text-xs">
                {product.reviewCount > 0 ? (
                  <>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(product.rating) ? "fill-amber-500 text-amber-500" : "text-ivory-400"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-charcoal-800">{product.rating.toFixed(1)}</span>
                    <a
                      href="#customer-reviews"
                      className="text-charcoal-600 underline decoration-ivory-400 underline-offset-4 hover:text-gold-800 transition-colors"
                    >
                      {product.reviewCount} {product.reviewCount === 1 ? "patron review" : "patron reviews"}
                    </a>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-700 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-600" />
                    <span>Vault Edition · Single-Loom Provenance</span>
                  </div>
                )}
              </div>

              {/* Pricing, Taxes & Dispatch Hierarchy */}
              <div className="mt-4 border-b border-ivory-300 pb-5">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-serif text-3xl font-medium text-charcoal-900 sm:text-4xl tracking-tight">
                    {formatPrice(unitPrice)}
                  </span>
                  {unitMrp > unitPrice && (
                    <>
                      <span className="text-sm text-charcoal-500 line-through">
                        MRP {formatPrice(unitMrp)}
                      </span>
                      <span className="inline-flex items-center rounded-xs bg-[#B08A45]/15 px-2.5 py-0.5 text-xs font-semibold text-[#8E6937] tracking-wider uppercase">
                        Save {formatPrice(savingsAmount)} ({discountPercent}% OFF)
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-charcoal-600 font-light">
                  <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Inclusive of all taxes</span>
                  </span>
                  <span className="text-charcoal-300">•</span>
                  <span className="inline-flex items-center gap-1.5 text-charcoal-700">
                    <Truck className="w-3.5 h-3.5 text-gold-700" />
                    <span>{unitPrice >= 4999 ? "Complimentary delivery included" : "Standard shipping · Free above ₹4,999"}</span>
                  </span>
                  <span className="text-charcoal-300">•</span>
                  <span className="text-charcoal-700">Timing confirmed post-dispatch</span>
                </div>
              </div>

              {/* Heritage Shade / Color Selector */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-charcoal-800 mb-2.5">
                  <span className="flex items-center gap-2">
                    <span className="text-charcoal-500">Heritage Shade:</span>
                    <span className="font-serif italic capitalize text-charcoal-900 font-medium text-sm">
                      {selectedColor}
                    </span>
                  </span>
                  {product.colors && product.colors.length > 1 && (
                    <span className="text-[11px] text-charcoal-500 font-normal">
                      {product.colors.length} Artisanal Shades Available
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {product.colors.map((c) => {
                    const isSelected = selectedColor === c.name;
                    const available = colorAvailable(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        disabled={!available}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedColor(c.name);
                          setCartNotice("");
                          const mappedIndex = findImageForColor(c.name);
                          if (mappedIndex !== activeImageIndex) {
                            setActiveImageIndex(mappedIndex);
                            setShowVideo(false);
                          }
                        }}
                        className={`group relative inline-flex min-h-11 items-center gap-2.5 border px-3.5 py-2 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-40 rounded-xs ${
                          isSelected
                            ? "border-[#24201D] bg-[#24201D] text-[#FAF8F5] font-semibold shadow-xs ring-1 ring-[#24201D]"
                            : "border-ivory-400 bg-ivory-50 text-charcoal-800 hover:border-gold-600 hover:bg-white"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border border-black/20 shrink-0 ${isSelected ? "ring-2 ring-gold-400 ring-offset-1" : ""}`}
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-gold-400 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Presentation */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-charcoal-800 mb-2.5">
                  <span className="flex items-center gap-2">
                    <span className="text-charcoal-500">Size:</span>
                    <span className="font-serif italic capitalize text-charcoal-900 font-medium text-sm">
                      {selectedSize}
                    </span>
                  </span>
                  {product.sizeFitGuide && (
                    <button
                      type="button"
                      onClick={() => setIsSizeChartOpen(true)}
                      className="text-gold-700 hover:text-gold-900 underline text-[11px] font-medium"
                    >
                      Size &amp; Fit Guide
                    </button>
                  )}
                </div>

                {product.sizes && product.sizes.length > 1 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize === size;
                      const available = sizeAvailable(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={!available}
                          aria-pressed={isSelected}
                          onClick={() => { setSelectedSize(size); setCartNotice(""); }}
                          className={`min-h-11 min-w-12 border px-3.5 py-2 text-xs font-semibold uppercase transition-all disabled:cursor-not-allowed disabled:opacity-40 rounded-xs ${
                            isSelected
                              ? "border-[#24201D] bg-[#24201D] text-[#FAF8F5] shadow-xs ring-1 ring-[#24201D]"
                              : "border-ivory-400 bg-ivory-50 text-charcoal-800 hover:border-gold-600 hover:bg-white"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex min-h-11 items-center gap-2 border border-[#24201D] bg-[#24201D] text-[#FAF8F5] px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xs shadow-xs">
                      <Check className="w-3.5 h-3.5 text-gold-400" />
                      <span>{selectedSize || "Standard"}</span>
                    </div>
                    {product.sizeFitGuide && (
                      <span className="text-xs text-charcoal-600 font-light">
                        {product.sizeFitGuide}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity Stepper & Stock Status */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-ivory-300 pt-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-charcoal-800 font-semibold">Quantity:</span>
                  <div className="flex items-center border border-ivory-400 rounded-xs bg-white shadow-2xs">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={!canAddSelectedItem || quantity <= 1}
                      className="inline-flex h-11 w-11 items-center justify-center text-lg text-charcoal-600 hover:text-charcoal-900 hover:bg-ivory-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      -
                    </button>
                    <span aria-live="polite" className="min-w-9 text-center text-sm font-semibold text-charcoal-900">{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                      disabled={!canAddSelectedItem || quantity >= availableStock}
                      className="inline-flex h-11 w-11 items-center justify-center text-lg text-charcoal-600 hover:text-charcoal-900 hover:bg-ivory-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Stock Status Indicator */}
                <div role="status" className="text-right">
                  {canAddSelectedItem ? (
                    availableStock > 5 ? (
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span>In Stock · Ready for Dispatch</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200/60 px-3 py-1.5 rounded-xs">
                        <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                        <span>Vault Exclusive · Only {availableStock} Left in Atelier</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-charcoal-500 bg-ivory-200 border border-ivory-300 px-3 py-1.5 rounded-xs">
                      <span className="h-2 w-2 rounded-full bg-charcoal-400"></span>
                      <span>Currently Reserved · Restock in Progress</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Purchase Action Buttons: Add to Bag & Buy Now */}
              <div className="mt-7 space-y-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddSelectedItem}
                  className="group relative flex min-h-14 w-full items-center justify-center gap-3 bg-[#24201D] px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#FAF8F5] transition-all hover:bg-[#39312A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:bg-charcoal-300 rounded-xs shadow-md"
                >
                  {cartNotice.startsWith("Added") ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Added to Heritage Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#B08A45] group-hover:scale-110 transition-transform" />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!canAddSelectedItem}
                  className="flex min-h-13 w-full items-center justify-center gap-2 border-2 border-[#B08A45] bg-[#F8F2E7] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#24201D] transition-all hover:bg-[#B08A45] hover:text-[#FAF8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:cursor-not-allowed disabled:border-ivory-400 disabled:text-charcoal-400 rounded-xs shadow-xs"
                >
                  <span>Buy Now</span>
                </button>
                {cartNotice && (
                  <p role="status" className="text-center text-xs text-charcoal-700 font-medium py-1" aria-live="polite">
                    {cartNotice}
                  </p>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-7 grid grid-cols-2 gap-3 border-y border-ivory-300 py-4 text-xs text-charcoal-700">
                <Link href="/shipping-policy" className="flex min-h-14 items-center gap-3 p-2 transition-colors hover:text-gold-800 hover:bg-ivory-200/50 rounded-xs">
                  <Truck className="w-4 h-4 text-gold-600 shrink-0" />
                  <div>
                    <span className="block font-semibold text-charcoal-900">
                      {unitPrice >= 4999 ? "Complimentary Shipping" : "Standard Shipping ₹250"}
                    </span>
                    <span className="text-[11px] text-charcoal-500 font-light">
                      {unitPrice >= 4999 ? "Insured door-to-door dispatch" : "Complimentary on ₹4,999+"}
                    </span>
                  </div>
                </Link>

                <Link href="/return-policy" className="flex min-h-14 items-center gap-3 p-2 transition-colors hover:text-gold-800 hover:bg-ivory-200/50 rounded-xs">
                  <RotateCcw className="w-4 h-4 text-gold-600 shrink-0" />
                  <div>
                    <span className="block font-semibold text-charcoal-900">7-Day Royal Exchange</span>
                    <span className="text-[11px] text-charcoal-500 font-light">Review exchange &amp; return policy</span>
                  </div>
                </Link>
              </div>

              {/* Share piece */}
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
        <section className="mt-14 border-y border-ivory-300 bg-ivory-50 px-5 py-8 sm:px-10 sm:py-10 rounded-xs">
          {/* Tab Navigation */}
          <div role="tablist" aria-label="Product information" className="flex gap-6 overflow-x-auto border-b border-ivory-300 text-[10px] font-semibold uppercase tracking-[.18em] sm:gap-10 sm:text-xs">
            <button
              onClick={() => setActiveTab("STORY")}
              role="tab"
              id="product-story-tab"
              aria-controls="product-info-panel"
              aria-selected={activeTab === "STORY"}
              className={`pb-3 border-b-2 transition-all shrink-0 ${
                activeTab === "STORY"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-500 hover:text-charcoal-900"
              }`}
            >
              Cultural Origin &amp; Story
            </button>
            <button
              onClick={() => setActiveTab("FABRIC")}
              role="tab"
              id="product-fabric-tab"
              aria-controls="product-info-panel"
              aria-selected={activeTab === "FABRIC"}
              className={`pb-3 border-b-2 transition-all shrink-0 ${
                activeTab === "FABRIC"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-500 hover:text-charcoal-900"
              }`}
            >
              Fabric &amp; Weaving Technique
            </button>
            <button
              onClick={() => setActiveTab("CARE")}
              role="tab"
              id="product-care-tab"
              aria-controls="product-info-panel"
              aria-selected={activeTab === "CARE"}
              className={`pb-3 border-b-2 transition-all shrink-0 ${
                activeTab === "CARE"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-500 hover:text-charcoal-900"
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
              className={`pb-3 border-b-2 transition-all shrink-0 ${
                activeTab === "SHIPPING"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-500 hover:text-charcoal-900"
              }`}
            >
              Shipping &amp; Returns
            </button>
          </div>

          {/* Tab Content Panel */}
          <div id="product-info-panel" role="tabpanel" aria-labelledby={`product-${activeTab.toLowerCase()}-tab`} className="max-w-3xl py-7 text-sm leading-7 text-charcoal-700">
            {activeTab === "STORY" && (
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-px w-5 bg-[#B08A45]" aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-gold-800">
                    {product.state || product.region ? `${product.state || product.region} Tradition` : "Artisan Provenance"}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-normal text-charcoal-900 sm:text-3xl">
                  The story behind this creation
                </h3>
                {product.culturalStory && (
                  <p className="font-serif text-base sm:text-lg italic text-charcoal-800 leading-relaxed border-l-2 border-gold-600 pl-4 py-1 bg-ivory-100/50">
                    {product.culturalStory}
                  </p>
                )}
                <div className="text-charcoal-700 space-y-3 font-light leading-relaxed">
                  {product.description.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "FABRIC" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-px w-5 bg-[#B08A45]" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-gold-800">
                      Technical Specifications
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-charcoal-900 sm:text-3xl">
                    Materials &amp; craftsmanship
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="border border-ivory-300 bg-white p-4 rounded-xs">
                    <span className="font-semibold uppercase tracking-wider text-charcoal-900 block mb-1.5 text-[10px]">
                      Fabric Composition
                    </span>
                    <p className="text-charcoal-700 font-light leading-relaxed">
                      {product.fabricDetails || "Pure Handloom Luxury Textile"}
                    </p>
                  </div>
                  <div className="border border-ivory-300 bg-white p-4 rounded-xs">
                    <span className="font-semibold uppercase tracking-wider text-charcoal-900 block mb-1.5 text-[10px]">
                      Dimensions &amp; Fit
                    </span>
                    <p className="text-charcoal-700 font-light leading-relaxed">
                      {product.sizeFitGuide || "Standard Fit"}
                    </p>
                  </div>
                  <div className="border border-ivory-300 bg-white p-4 rounded-xs">
                    <span className="font-semibold uppercase tracking-wider text-charcoal-900 block mb-1.5 text-[10px]">
                      Origin &amp; Regional Loom
                    </span>
                    <p className="text-charcoal-700 font-light leading-relaxed">
                      {product.state || product.region || "Heritage Artisan Clusters of India"}
                    </p>
                  </div>
                  <div className="border border-ivory-300 bg-white p-4 rounded-xs">
                    <span className="font-semibold uppercase tracking-wider text-charcoal-900 block mb-1.5 text-[10px]">
                      Authenticity
                    </span>
                    <p className="text-charcoal-700 font-light leading-relaxed">
                      Authentic Handloom Heirloom · Singular Loom Craftsmanship
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "CARE" && (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-px w-5 bg-[#B08A45]" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-gold-800">
                      Preservation Protocol
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-charcoal-900 sm:text-3xl">
                    Heirloom care guide
                  </h3>
                </div>
                <p className="text-charcoal-700 font-light leading-relaxed">
                  {product.careInstructions || "Professional dry clean only. Preserve in breathable cotton or muslin wraps. Refurl every 6 months to prevent creasing."}
                </p>
                <div className="border-t border-ivory-300 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3.5 border border-ivory-300 rounded-xs">
                    <span className="font-semibold text-charcoal-900 block mb-1">Dry Clean Only</span>
                    <span className="text-[11px] text-charcoal-500 font-light">To protect delicate natural silks and metallic zari.</span>
                  </div>
                  <div className="bg-white p-3.5 border border-ivory-300 rounded-xs">
                    <span className="font-semibold text-charcoal-900 block mb-1">Muslin Storage</span>
                    <span className="text-[11px] text-charcoal-500 font-light">Store in pure unbleached muslin away from moisture.</span>
                  </div>
                  <div className="bg-white p-3.5 border border-ivory-300 rounded-xs">
                    <span className="font-semibold text-charcoal-900 block mb-1">Low Steam Iron</span>
                    <span className="text-[11px] text-charcoal-500 font-light">Press on reverse with a protective cloth barrier.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "SHIPPING" && (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-px w-5 bg-[#B08A45]" aria-hidden="true" />
                    <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-gold-800">
                      White-Glove Dispatch
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-normal text-charcoal-900 sm:text-3xl">
                    Shipping &amp; returns
                  </h3>
                </div>
                <div className="space-y-3 text-charcoal-700 font-light leading-relaxed">
                  <p>
                    Complimentary domestic shipping is provided on all orders of ₹4,999 and above. For orders under ₹4,999, a flat standard shipping fee of ₹250 applies. Expected delivery timing is confirmed after courier dispatch.
                  </p>
                  <p>
                    Each heirloom arrives in our signature gold-embossed ivory rigid gift box enveloped in unbleached muslin wrap with wax seal protection. Eligible pieces may be exchanged within 7 days of delivery under our royal exchange policy.
                  </p>
                </div>
                <div className="flex flex-wrap gap-5 text-xs font-semibold uppercase tracking-widest pt-2">
                  <Link href="/shipping-policy" className="border-b border-gold-600 pb-1 text-charcoal-900 hover:text-gold-800 transition-colors">
                    Shipping Policy &rarr;
                  </Link>
                  <Link href="/return-policy" className="border-b border-gold-600 pb-1 text-charcoal-900 hover:text-gold-800 transition-colors">
                    Return &amp; Exchange Policy &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section id="customer-reviews" className="mt-12 scroll-mt-32 border-y border-ivory-300 bg-ivory-50 px-5 py-8 sm:px-10 sm:py-10 rounded-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-ivory-300 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="h-px w-5 bg-[#B08A45]" aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-[0.24em] font-semibold text-gold-800">
                  Patron Memoirs
                </span>
              </div>
              <h3 className="font-serif text-2xl font-normal text-charcoal-900 sm:text-3xl">
                Customer reviews
              </h3>
              <p className="text-xs text-charcoal-600 mt-1">
                Verified patron impressions on drape, weight, and weave
              </p>
            </div>
            {product.reviewCount > 0 ? (
              <div className="flex items-center gap-3">
                <div className="text-3xl font-serif font-bold text-charcoal-900">{product.rating.toFixed(1)}</div>
                <div>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.rating) ? "fill-amber-500 text-amber-500" : "text-ivory-400"}`} />
                    ))}
                  </div>
                  <div className="text-[11px] text-charcoal-500">Based on {reviews.length} patron reviews</div>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs text-gold-800 font-medium">
                <Sparkles className="w-4 h-4 text-gold-600" />
                <span>Vault Single-Loom Edition</span>
              </div>
            )}
          </div>

          {/* Existing reviews or luxury zero-review empty state */}
          <div className="py-6">
            {reviews.length === 0 ? (
              <div className="rounded-xs border border-ivory-300 bg-white p-8 text-center max-w-2xl mx-auto my-4 shadow-2xs">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B08A45]/10 text-gold-700 mb-4">
                  <Star className="h-6 w-6 fill-[#B08A45]/20 text-gold-700" />
                </div>
                <h4 className="font-serif text-xl sm:text-2xl font-medium text-charcoal-900 mb-2">
                  Be the First to Inscribe a Patron Memoir
                </h4>
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed max-w-lg mx-auto font-light">
                  Each PREHERITAGE creation is a singular artisanal masterpiece. If you have welcomed this heirloom into your collection, we invite you to share your impressions on the weave, texture, and drape.
                </p>
                <p className="text-[11px] text-gold-800 mt-4 uppercase tracking-wider font-medium">
                  Verified Patron Reviews · Handcrafted Heritage Provenance
                </p>
              </div>
            ) : (
              <div className="divide-y divide-ivory-200 space-y-6">
                {reviews.map((r) => (
                  <div key={r.id} className="pt-6 first:pt-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-charcoal-900">{r.author}</span>
                        {r.verified && (
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xs flex items-center gap-1 font-medium">
                            <Check className="w-2.5 h-2.5 text-emerald-700" /> Verified Patron
                          </span>
                        )}
                      </div>
                      <span className="text-charcoal-500 font-light">{r.date}</span>
                    </div>
                    <div className="flex text-amber-500 mb-2">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-charcoal-900 mb-1">{r.title}</h4>
                    <p className="text-xs text-charcoal-700 leading-relaxed font-light">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add a Review Form */}
          <div className="mt-8 pt-6 border-t border-ivory-300">
            <h4 className="font-serif text-lg font-medium text-charcoal-900 mb-1.5">
              Write a Review
            </h4>
            <p className="text-xs text-charcoal-600 mb-4">
              Share details regarding the fabric weight, embroidery finishing, and drape.
            </p>
            {reviewNotice && (
              <p role="status" className="mb-4 max-w-xl text-xs font-medium text-gold-800 bg-gold-50 p-3 border border-gold-200 rounded-xs" aria-live="polite">
                {reviewNotice}
              </p>
            )}
            {canReview ? (
              <form onSubmit={handleAddReview} className="space-y-4 max-w-xl">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-600 block mb-1">
                    Rating
                  </label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="bg-white border border-ivory-400 px-3 py-2 text-xs rounded-xs focus:outline-none focus:border-gold-500"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-600 block mb-1">
                    Your Memoir / Review
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Describe the texture, zari sheen, and feel of the weave..."
                    className="w-full bg-white border border-ivory-400 px-3.5 py-2.5 text-xs rounded-xs focus:outline-none focus:border-gold-500 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#24201D] hover:bg-[#B08A45] hover:text-[#24201D] text-[#FAF8F5] text-xs uppercase tracking-[0.18em] font-semibold transition-colors rounded-xs shadow-xs"
                >
                  Submit Memoir
                </button>
              </form>
            ) : (
              <p className="text-xs text-charcoal-600">
                <Link className="font-semibold text-gold-800 underline hover:text-gold-900" href={`/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`}>
                  Sign in
                </Link>{" "}
                with your patron account to review this product after delivery.
              </p>
            )}
          </div>
        </section>

        {/* Related Heritage Creations */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-end mb-8 border-b border-ivory-300 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-gold-700 font-semibold font-sans block mb-1">
                  Curated Complements
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-charcoal-900">
                  Related Pieces from the Looms
                </h3>
              </div>
              <Link href="/shop" className="text-xs uppercase tracking-wider text-charcoal-700 hover:text-gold-800 transition-colors font-semibold hidden sm:inline-block">
                View All Collections &rarr;
              </Link>
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
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-ivory-300 bg-[#FAF8F5]/98 px-4 py-3 backdrop-blur-md shadow-2xl sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {primaryImage && (
              <div className="relative aspect-[4/5] w-11 shrink-0 overflow-hidden rounded-xs border border-ivory-300">
                <Image src={primaryImage} alt="" fill unoptimized={primaryImage.startsWith("/api/storage/")} className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-charcoal-900">{product.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-sm font-semibold text-charcoal-900">{formatPrice(unitPrice)}</span>
                <span className="text-[10px] text-charcoal-500 uppercase">{selectedSize}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!canAddSelectedItem}
            aria-label={cartNotice.startsWith("Added") ? "Added to bag" : "Add to bag"}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xs bg-[#24201D] px-5 text-xs font-semibold uppercase tracking-wider text-[#FAF8F5] transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:bg-charcoal-300 shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-gold-400" />
            <span>{cartNotice.startsWith("Added") ? "Added" : "Add to Bag"}</span>
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
          <section role="dialog" aria-modal="true" aria-labelledby="size-guide-title" className="w-full max-w-lg border border-ivory-300 bg-ivory-50 p-6 sm:p-8 rounded-xs shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-ivory-300 mb-4">
              <h3 id="size-guide-title" className="font-serif text-2xl font-medium text-charcoal-900">Size &amp; Fit Guide</h3>
              <button
                onClick={() => setIsSizeChartOpen(false)}
                aria-label="Close size guide"
                className="inline-flex h-10 w-10 items-center justify-center text-charcoal-500 hover:text-charcoal-900 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-5 text-sm leading-6 text-charcoal-700">
              <p>{product.sizeFitGuide || "Please contact our concierge for bespoke sizing and draping guidance."}</p>
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.18em] text-charcoal-500">Available options</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <span key={size} className="border border-ivory-400 px-3 py-1.5 text-xs font-medium text-charcoal-800 bg-white rounded-xs">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
