"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { ProductItem, SAMPLE_PRODUCTS } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { createCartItem } from "@/lib/cart-model";
import { QuickViewModal } from "./QuickViewModal";

interface ProductCardProps {
  product: ProductItem;
  compact?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compact = false,
  className = "",
}) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist, wishlistReady } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Free Size");
  const [unavailableImages, setUnavailableImages] = useState<string[]>([]);
  const [quickAddMessage, setQuickAddMessage] = useState("");
  const quickAddAvailable = Boolean(createCartItem(product, selectedSize, product.colors[0]?.name, 1).item);

  const isFavorited = isInWishlist(product.id);
  const sampleProduct = SAMPLE_PRODUCTS.find((p) => p.slug === product.slug || p.id === product.id);
  const resolvedImages =
    product.images && product.images.length > 0 && !product.images[0].includes("images.unsplash.com")
      ? product.images
      : sampleProduct?.images || product.images || [];
  const primaryImage = resolvedImages[0];
  const secondaryImage = resolvedImages[1] || resolvedImages[0];
  const hasDistinctSecondary = Boolean(
    secondaryImage && secondaryImage !== primaryImage && !unavailableImages.includes(secondaryImage)
  );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = addToCart(product, selectedSize, product.colors[0]?.name, 1, primaryImage);
    if (!result.success) {
      setQuickAddMessage(result.message || "This selection is unavailable.");
      setTimeout(() => setQuickAddMessage(""), 3000);
    } else {
      setQuickAddMessage("Added to Bag");
      setTimeout(() => setQuickAddMessage(""), 3000);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const renderBadge = () => {
    const badgeType = product.badge || (product.isBestSeller ? "BESTSELLER" : undefined);
    if (!badgeType) return null;
    if (badgeType === "SALE" && (product.mrp <= product.price || !product.discount)) {
      return null;
    }

    const styles: Record<string, string> = {
      NEW: "bg-charcoal text-ivory",
      BESTSELLER: "bg-[#24201D] text-[#FAF8F5] font-medium",
      SALE: "bg-burgundy text-white font-semibold",
      LIMITED_EDITION: "bg-stone-800 text-gold",
      LOW_STOCK: "bg-amber-800 text-white",
    };
    const labels: Record<string, string> = {
      NEW: "New Arrival",
      BESTSELLER: "Bestseller",
      SALE: `${product.discount}% Off`,
      LIMITED_EDITION: "Single-Loom",
      LOW_STOCK: "Few in Vault",
    };

    return (
      <span
        className={`absolute top-2.5 left-2.5 z-10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] font-sans font-medium shadow-xs ${
          styles[badgeType] || "bg-charcoal text-white"
        }`}
      >
        {labels[badgeType] || badgeType}
      </span>
    );
  };

  return (
    <article
      className={`group relative flex flex-col bg-white border border-stone-200 transition-all duration-300 hover:border-[#B08A45] ${
        compact ? "w-full max-w-[236px] hover:shadow-xs" : "hover:border-gold hover:shadow-luxury"
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame with Museum Ratio */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        {renderBadge()}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          disabled={!wishlistReady}
          className={`absolute right-2.5 top-2.5 z-10 inline-flex items-center justify-center bg-white/90 backdrop-blur-sm border border-stone-200 text-charcoal transition-colors hover:text-burgundy focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
            compact ? "h-8 w-8" : "h-9 w-9"
          }`}
          aria-label={isFavorited ? `Remove ${product.title} from favorites` : `Add ${product.title} to favorites`}
          aria-pressed={isFavorited}
          aria-busy={!wishlistReady}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isFavorited ? "text-burgundy fill-burgundy" : ""
            }`}
          />
        </button>

        {/* Quick View Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsQuickViewOpen(true);
          }}
          className="absolute right-3 top-14 z-10 inline-flex h-9 w-9 items-center justify-center bg-white/90 backdrop-blur-sm border border-stone-200 text-charcoal transition-colors hover:text-gold-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          aria-label={`Quick view ${product.title}`}
          title="Quick View"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Product Image Link */}
        <Link
          href={`/products/${product.slug}`}
          className="relative block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          {primaryImage && !unavailableImages.includes(primaryImage) ? (
            <>
              <Image
                src={primaryImage}
                alt={product.title}
                fill
                unoptimized={primaryImage.startsWith("/api/storage/")}
                onError={() =>
                  setUnavailableImages((current) =>
                    current.includes(primaryImage) ? current : [...current, primaryImage]
                  )
                }
                className={`object-cover object-top transition-all duration-700 ease-out group-hover:scale-105 ${
                  hasDistinctSecondary && isHovered ? "opacity-0" : "opacity-100"
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
              {hasDistinctSecondary && (
                <Image
                  src={secondaryImage}
                  alt={`${product.title} detailed craft view`}
                  fill
                  unoptimized={secondaryImage.startsWith("/api/storage/")}
                  onError={() =>
                    setUnavailableImages((current) =>
                      current.includes(secondaryImage) ? current : [...current, secondaryImage]
                    )
                  }
                  className={`object-cover object-top transition-all duration-700 ease-out group-hover:scale-105 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              )}
            </>
          ) : (
            <span
              className="grid h-full w-full place-items-center font-serif text-2xl font-light text-gold"
              aria-label="Product image unavailable"
            >
              PREHERITAGE
            </span>
          )}
        </Link>

        {/* Quick Add / Quick View Actions */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 bg-gradient-to-t from-charcoal/90 via-charcoal/60 to-transparent p-3 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
              className="min-h-10 w-full bg-white/95 px-2 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-charcoal transition-colors hover:bg-gold hover:text-charcoal flex items-center justify-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label={`Quick preview for ${product.title}`}
            >
              <Eye className="w-3.5 h-3.5 text-gold-700" />
              <span>Quick View</span>
            </button>
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={!quickAddAvailable}
              className="min-h-10 w-full bg-charcoal-900 px-2 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-ivory-50 transition-colors hover:bg-gold hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:cursor-not-allowed disabled:bg-stone-400 disabled:text-stone-200 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-gold" />
              <span>{quickAddAvailable ? "Reserve" : "Sold Out"}</span>
            </button>
          </div>
          {quickAddMessage && (
            <span role="status" className="text-center text-[10px] text-ivory font-mono">
              {quickAddMessage}
            </span>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className={`flex flex-1 flex-col justify-between bg-white ${compact ? "p-3 sm:p-3.5" : "p-4"}`}>
        <div>
          {/* Region / Category Overline */}
          <div className="mb-1 flex items-center justify-between gap-1 text-[9.5px] font-medium uppercase tracking-[0.18em] text-[#B08A45]">
            <span className="truncate">{product.state || product.region || "Heritage Handloom"}</span>
            <span className="text-stone-400 font-sans truncate">{product.category}</span>
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block group-hover:text-[#B08A45] transition-colors">
            <h3 className={`font-serif font-light leading-snug text-charcoal ${
              compact ? "line-clamp-1 text-sm sm:text-[15px]" : "line-clamp-2 text-lg sm:text-xl"
            }`}>
              {product.title}
            </h3>
          </Link>

          {/* Short Truncated Description */}
          {(product.shortDesc || product.description) && (
            <p className="mt-1 line-clamp-2 text-[11px] text-stone-500 font-light leading-relaxed">
              {product.shortDesc || product.description}
            </p>
          )}
        </div>

        {/* Pricing & Rating Integrity */}
        <div className={`flex items-center justify-between gap-2 border-t border-stone-200/80 ${compact ? "mt-3 pt-2" : "mt-4 pt-3"}`}>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-serif font-medium text-charcoal ${compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"}`}>
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-stone-400 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>

          <div className="flex items-center text-[11px] text-stone-500">
            {product.reviewCount > 0 ? (
              <>
                <span className="text-amber-500 mr-1">★</span>
                <span className="font-medium text-charcoal">{product.rating}</span>
                <span className="text-stone-400 text-[10px] ml-1">({product.reviewCount})</span>
              </>
            ) : (
              <span className="text-[10px] text-gold uppercase tracking-[0.16em] font-medium">
                Vault Edition
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </article>
  );
};

export default ProductCard;
