"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Heart, ShoppingBag, ArrowRight, ShieldCheck, Truck, RotateCcw, ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { ProductItem } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { getSellableStock, isVariantAvailable } from "@/lib/inventory";

interface QuickViewModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist, wishlistReady } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [addNotice, setAddNotice] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize or reset selections when product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setSelectedSize(product.sizes[0] || "Free Size");
      setSelectedColor(product.colors[0]?.name || "Standard");
      setQuantity(1);
      setAddNotice("");
    }
  }, [product]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const isFavorited = isInWishlist(product.id);
  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[activeImageIndex] || images[0] || "";

  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const selectedVariant = product.variants?.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );
  const selectedVariantAvailable = selectedVariant
    ? isVariantAvailable(product, selectedVariant.id)
    : !hasVariants && getSellableStock(product) > 0;
  const availableStock = selectedVariantAvailable
    ? selectedVariant?.stock ?? getSellableStock(product)
    : 0;
  const canAddToCart = Boolean(selectedVariantAvailable && availableStock > 0);

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    setIsAdding(true);
    const result = addToCart(product, selectedSize, selectedColor, quantity);
    setIsAdding(false);
    if (result.success) {
      setAddNotice("Added to your shopping bag");
      setTimeout(() => setAddNotice(""), 3500);
    } else {
      setAddNotice(result.message || "Selection unavailable");
      setTimeout(() => setAddNotice(""), 3500);
    }
  };

  const nextImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Quick product preview"
      aria-labelledby="quick-view-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        className="relative z-10 max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded bg-ivory-50 shadow-2xl border border-ivory-300 text-charcoal-900"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-charcoal-800 backdrop-blur-sm border border-stone-200 shadow-sm transition-colors hover:bg-gold-50 hover:text-charcoal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          aria-label="Close Quick View"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image Gallery */}
          <div className="relative flex flex-col justify-between bg-stone-100 p-6">
            {/* Main Image Frame */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-stone-200">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={product.title}
                  fill
                  unoptimized={currentImage.startsWith("/api/storage/")}
                  className="object-cover object-top transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-gold-600">
                  PREHERITAGE
                </div>
              )}

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-charcoal-900 shadow hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-charcoal-900 shadow hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Badge */}
              {product.badge && (
                <span className="absolute left-3 top-3 bg-charcoal-900/90 text-ivory-100 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] font-medium backdrop-blur-xs">
                  {product.badge.replaceAll("_", " ")}
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img + idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative h-16 w-14 shrink-0 overflow-hidden rounded border transition-all ${
                      activeImageIndex === idx
                        ? "border-gold-600 ring-2 ring-gold-400"
                        : "border-stone-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} thumbnail ${idx + 1}`}
                      fill
                      unoptimized={img.startsWith("/api/storage/")}
                      className="object-cover object-top"
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details & Add to Cart */}
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div className="space-y-4">
              {/* Category & Region */}
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">
                <span>{product.state || product.region}</span>
                <span className="text-charcoal-400 font-sans">{product.category}</span>
              </div>

              {/* Product Title */}
              <h2 id="quick-view-title" className="font-serif text-2xl sm:text-3xl font-light leading-snug text-charcoal-900">
                {product.title}
              </h2>

              {/* Price & Savings */}
              <div className="flex items-baseline gap-3 border-b border-ivory-300 pb-4">
                <span className="font-serif text-2xl sm:text-3xl font-medium text-charcoal-900">
                  {formatPrice(product.price)}
                </span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-sm text-charcoal-400 line-through">
                      {formatPrice(product.mrp)}
                    </span>
                    <span className="rounded bg-burgundy/10 px-2 py-0.5 text-xs font-semibold text-burgundy">
                      Save {formatPrice(product.mrp - product.price)}
                    </span>
                  </>
                )}
              </div>

              {/* Cultural Story / Short description */}
              <p className="text-xs sm:text-sm text-charcoal-600 font-light leading-relaxed">
                {product.shortDesc || product.culturalStory}
              </p>

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-charcoal-700">Artisanal Shade</span>
                    <span className="font-semibold text-charcoal-900">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color.name)}
                        className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all ${
                          selectedColor === color.name
                            ? "bg-charcoal-900 text-ivory-50 ring-2 ring-gold-500"
                            : "bg-ivory-200 text-charcoal-700 hover:bg-ivory-300"
                        }`}
                      >
                        {color.hex && (
                          <span
                            className="h-3 w-3 rounded-full border border-black/20"
                            style={{ backgroundColor: color.hex }}
                          />
                        )}
                        <span>{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-charcoal-700">Dimensions / Size</span>
                    <span className="font-semibold text-charcoal-900">{selectedSize}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-10 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                          selectedSize === size
                            ? "bg-charcoal-900 text-ivory-50 ring-2 ring-gold-500 shadow-sm"
                            : "bg-white border border-stone-300 text-charcoal-800 hover:border-gold-500"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status Indicator */}
              <div className="pt-2 text-xs">
                {canAddToCart ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" />
                    {availableStock <= 3
                      ? `Vault Reserve: Only ${availableStock} piece${availableStock === 1 ? "" : "s"} available`
                      : "Available for Immediate Dispatch"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-rose-700">
                    Currently Vault-Restricted / In Private Curation
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons & Links */}
            <div className="mt-6 space-y-3 border-t border-ivory-300 pt-4">
              {/* Quantity and Add to Bag */}
              <div className="flex gap-3">
                {/* Quantity Control */}
                <div className="flex items-center rounded border border-stone-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-charcoal-700 hover:text-charcoal-950 disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-semibold text-charcoal-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    disabled={quantity >= availableStock}
                    className="px-3 py-2 text-charcoal-700 hover:text-charcoal-950 disabled:opacity-30"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || isAdding}
                  className="flex flex-1 items-center justify-center gap-2 rounded bg-charcoal-900 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ivory-50 shadow-sm transition-colors hover:bg-gold-600 hover:text-charcoal-950 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{canAddToCart ? "Add to Shopping Bag" : "Vault Restricted"}</span>
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  disabled={!wishlistReady}
                  className="flex h-11 w-11 items-center justify-center rounded border border-stone-300 bg-white text-charcoal-700 transition-colors hover:border-burgundy hover:text-burgundy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavorited ? "fill-burgundy text-burgundy" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Status Notice */}
              {addNotice && (
                <p role="status" className="rounded bg-ivory-200 p-2 text-center text-xs font-medium text-charcoal-800">
                  {addNotice}
                </p>
              )}

              {/* Full Product Page Link */}
              <div className="pt-2 text-center">
                <Link
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-800 transition-colors hover:text-charcoal-900"
                >
                  <span>View Full Heirloom Craft Details & Heritage Narrative</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;

