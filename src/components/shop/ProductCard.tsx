"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { ProductItem } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: ProductItem;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Standard");

  const isFavorited = isInWishlist(product.id);
  const primaryImage = product.images[0];
  const secondaryImage = product.images[1] || product.images[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, selectedSize, product.colors[0]?.name, 1);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  // Badge configuration
  const renderBadge = () => {
    if (!product.badge) return null;
    const styles: Record<string, string> = {
      NEW: "bg-charcoal-900 text-ivory-50",
      BESTSELLER: "bg-gold-600 text-white",
      SALE: "bg-heritage-crimson text-white",
      LIMITED_EDITION: "bg-gold-700 text-white font-semibold",
      LOW_STOCK: "bg-amber-600 text-white",
    };
    const labels: Record<string, string> = {
      NEW: "New Arrival",
      BESTSELLER: "Bestseller",
      SALE: `${product.discount}% Off`,
      LIMITED_EDITION: "Limited Edition",
      LOW_STOCK: "Only Few Left",
    };

    return (
      <span
        className={`absolute top-3 left-3 z-10 px-2.5 py-1 text-[10px] uppercase tracking-widest font-sans font-medium rounded-xs shadow-sm ${
          styles[product.badge] || "bg-charcoal-900 text-white"
        }`}
      >
        {labels[product.badge] || product.badge}
      </span>
    );
  };

  return (
    <div
      className="group relative flex flex-col bg-ivory-50 rounded-sm overflow-hidden border border-ivory-200 hover:border-gold-300 transition-all duration-300 hover:shadow-luxury"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-ivory-200">
        {renderBadge()}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur-sm text-charcoal-800 hover:text-heritage-crimson hover:bg-white transition-all shadow-sm"
          aria-label="Save to wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorited ? "text-heritage-crimson fill-heritage-crimson" : ""
            }`}
          />
        </button>

        {/* Image link */}
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={isHovered ? secondaryImage : primaryImage}
            alt={product.title}
            fill
            className="object-cover object-top transition-all duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </Link>

        {/* Quick Add Overlay on Desktop Hover */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
          {product.sizes.length > 1 && (
            <div className="flex justify-center gap-1.5">
              {product.sizes.slice(0, 5).map((size) => (
                <button
                  key={size}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded transition-colors ${
                    selectedSize === size
                      ? "bg-gold-500 text-charcoal-950"
                      : "bg-white/80 text-charcoal-900 hover:bg-white"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleQuickAdd}
            className="w-full py-2.5 bg-ivory-50 hover:bg-gold-500 text-charcoal-950 hover:text-charcoal-950 font-sans text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors rounded-xs shadow-md"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Region / Category Breadcrumb */}
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gold-600 font-medium mb-1">
            <span>{product.state || product.region}</span>
            <span className="text-charcoal-100 font-sans">{product.category}</span>
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block group-hover:text-gold-700 transition-colors">
            <h3 className="font-serif text-sm sm:text-base font-semibold text-charcoal-900 line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </Link>

          {/* Short Story snippet */}
          <p className="text-[11px] text-charcoal-100 mt-1 line-clamp-1 font-light">
            {product.shortDesc}
          </p>
        </div>

        {/* Pricing & Rating */}
        <div className="mt-3 pt-3 border-t border-ivory-200 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-bold text-base sm:text-lg text-charcoal-900">
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-charcoal-50 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>

          {/* Star Rating */}
          <div className="flex items-center text-[11px] text-charcoal-200">
            <span className="text-amber-500 mr-1">★</span>
            <span className="font-medium">{product.rating}</span>
            <span className="text-charcoal-50 text-[10px] ml-1">({product.reviewCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
