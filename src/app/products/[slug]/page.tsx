"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  Heart,
  ShoppingBag,
  Share2,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Star,
  Play,
  HelpCircle,
  Copy,
  MessageCircle,
} from "lucide-react";
import { SAMPLE_PRODUCTS, ProductItem } from "@/lib/sample-data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/shop/ProductCard";

interface ProductPageProps {
  params: { slug: string };
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const router = useRouter();
  const product = SAMPLE_PRODUCTS.find((p) => p.slug === params.slug) || SAMPLE_PRODUCTS[0];
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "Free Size");
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || "Standard");
  const [quantity, setQuantity] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"STORY" | "FABRIC" | "CARE" | "SHIPPING">("STORY");

  // Reviews state
  const [reviews, setReviews] = useState([
    {
      id: "r1",
      author: "Maharani Nandini R.",
      rating: 5,
      date: "14 October 2026",
      verified: true,
      title: "Pure Heirloom Quality",
      comment: "The antique gold electroplated zari on this Katan silk saree has a luminous subtlety that photograph cannot fully capture. Truly regal.",
    },
    {
      id: "r2",
      author: "Vikramaditya S.",
      rating: 5,
      date: "02 October 2026",
      verified: true,
      title: "Remarkable Craftsmanship",
      comment: "Delivered in signature ivory hardbox packaging with the official GI weaver certification. The texture is breathtaking.",
    },
  ]);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);

  const isFavorited = isInWishlist(product.id);
  const savingsAmount = product.mrp > product.price ? product.mrp - product.price : 0;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    router.push("/checkout");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewComment) return;
    setReviews([
      {
        id: `r-${Date.now()}`,
        author: newReviewAuthor,
        rating: newReviewRating,
        date: "Just now",
        verified: true,
        title: "Verified Patron Review",
        comment: newReviewComment,
      },
      ...reviews,
    ]);
    setNewReviewAuthor("");
    setNewReviewComment("");
  };

  const relatedProducts = SAMPLE_PRODUCTS.filter(
    (p) => p.id !== product.id && (p.category === product.category || p.region === product.region)
  ).slice(0, 4);

  return (
    <div className="bg-ivory-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-xs text-charcoal-100 mb-6 font-light">
          <Link href="/" className="hover:text-charcoal-900">Home</Link> /{" "}
          <Link href="/shop" className="hover:text-charcoal-900">Collections</Link> /{" "}
          <Link href={`/shop?category=${product.category}`} className="hover:text-charcoal-900 capitalize">
            {product.category}
          </Link>{" "}
          / <span className="text-charcoal-900 font-medium">{product.title}</span>
        </div>

        {/* Top Product View: Gallery (Left) & Purchasing Info (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-ivory-50 p-6 sm:p-10 rounded-sm border border-ivory-300 shadow-sm">
          {/* Gallery Showcase */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-24 shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setShowVideo(false);
                  }}
                  className={`relative aspect-[3/4] w-16 sm:w-full rounded bg-ivory-200 overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx && !showVideo
                      ? "border-gold-600 shadow-sm"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`${product.title} thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}

              {product.videoUrl && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={`relative aspect-[3/4] w-16 sm:w-full rounded bg-charcoal-900 flex flex-col items-center justify-center text-gold-400 border-2 shrink-0 ${
                    showVideo ? "border-gold-600" : "border-transparent"
                  }`}
                >
                  <Play className="w-5 h-5" />
                  <span className="text-[9px] uppercase tracking-wider font-semibold mt-1">Video</span>
                </button>
              )}
            </div>

            {/* Main Image Frame */}
            <div className="relative aspect-[3/4] flex-1 bg-ivory-200 rounded-sm overflow-hidden border border-ivory-300 group">
              {showVideo && product.videoUrl ? (
                <video
                  src={product.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.title}
                  fill
                  priority
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              )}

              {/* Wishlist Button on Image */}
              <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-charcoal-800 hover:text-heritage-crimson transition-all shadow-md"
                aria-label="Save to wishlist"
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
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Region & SKU */}
              <div className="flex items-center justify-between text-xs text-gold-700 font-semibold uppercase tracking-widest mb-1.5">
                <span>{product.state || product.region} Heritage</span>
                <span className="text-charcoal-100 font-mono text-[11px]">{product.sku}</span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 leading-snug">
                {product.title}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-2 mt-2 pb-4 border-b border-ivory-200 text-xs">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>
                <span className="font-semibold text-charcoal-800">{product.rating}</span>
                <span className="text-charcoal-100">({product.reviewCount} Patron Reviews)</span>
                <span className="text-ivory-400">•</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Silk Mark Certified
                </span>
              </div>

              {/* Pricing */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-serif font-bold text-2xl sm:text-3xl text-charcoal-900">
                  {formatPrice(product.price)}
                </span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-sm text-charcoal-50 line-through">
                      MRP {formatPrice(product.mrp)}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded">
                      Save {formatPrice(savingsAmount)} ({product.discount}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-charcoal-100 mt-1 font-light">
                Inclusive of all taxes. Free Express Insured Shipping across India.
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
                      onClick={() => setSelectedColor(c.name)}
                      className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-all ${
                        selectedColor === c.name
                          ? "border-gold-600 bg-gold-50 text-gold-900 font-medium"
                          : "border-ivory-300 bg-white text-charcoal-800 hover:border-gold-400"
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

              {/* Size Selector & Size Chart */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-charcoal-800 mb-2">
                  <span>Select Size</span>
                  <button
                    onClick={() => setIsSizeChartOpen(true)}
                    className="text-gold-700 hover:text-gold-900 underline lowercase text-[11px]"
                  >
                    view size guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-12 px-3 py-2 text-xs font-semibold uppercase rounded transition-all border ${
                        selectedSize === size
                          ? "bg-charcoal-900 text-ivory-50 border-charcoal-900 shadow-sm"
                          : "bg-white text-charcoal-800 border-ivory-300 hover:border-gold-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Stock Availability Alert */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-charcoal-800 font-semibold">Quantity:</span>
                  <div className="flex items-center border border-ivory-300 rounded bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2.5 py-1 text-charcoal-400 hover:text-charcoal-900 text-sm"
                    >
                      -
                    </button>
                    <span className="px-3 text-xs font-bold text-charcoal-900">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-2.5 py-1 text-charcoal-400 hover:text-charcoal-900 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-medium">
                  Only {product.stock} pieces woven for this launch
                </div>
              </div>

              {/* Action Buttons: Add to Cart & Buy Now */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-[0.22em] font-semibold flex items-center justify-center gap-2 transition-colors rounded-xs shadow-luxury"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Heritage Bag</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 text-charcoal-950 text-xs uppercase tracking-[0.22em] font-semibold flex items-center justify-center gap-2 transition-colors rounded-xs shadow-gold"
                >
                  <span>Buy Now with 1-Click</span>
                </button>
              </div>

              {/* Trust & Dispatch Highlights */}
              <div className="mt-8 pt-6 border-t border-ivory-200 grid grid-cols-2 gap-4 text-xs text-charcoal-200">
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-charcoal-900 block">Express Delivery</span>
                    <span className="text-[11px] text-charcoal-100">Dispatches in 24-48 hours</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <RotateCcw className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-charcoal-900 block">7-Day Royal Exchange</span>
                    <span className="text-[11px] text-charcoal-100">Hassle-free reverse pickup</span>
                  </div>
                </div>
              </div>

              {/* Share section */}
              <div className="mt-6 pt-4 border-t border-ivory-200 flex items-center justify-between text-xs text-charcoal-100">
                <span className="font-medium text-charcoal-300">Share this heritage story:</span>
                <div className="flex items-center gap-3">
                  <a
                    href={`https://wa.me/?text=Check%20out%20this%20rare%20piece%20from%20PREHERITAGE:%20${encodeURIComponent(product.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 hover:text-emerald-700 transition-colors"
                    title="Share on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 hover:text-charcoal-900 transition-colors"
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
        <div className="mt-12 bg-ivory-50 rounded-sm border border-ivory-300 p-6 sm:p-10 shadow-sm">
          {/* Tab Navigation */}
          <div className="flex border-b border-ivory-300 gap-6 sm:gap-10 overflow-x-auto text-xs uppercase tracking-widest font-semibold pb-3">
            <button
              onClick={() => setActiveTab("STORY")}
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
              className={`pb-3 border-b-2 transition-all ${
                activeTab === "SHIPPING"
                  ? "border-gold-600 text-charcoal-900 font-bold"
                  : "border-transparent text-charcoal-100 hover:text-charcoal-900"
              }`}
            >
              Insured Transit & Returns
            </button>
          </div>

          {/* Tab Content */}
          <div className="py-6 text-sm text-charcoal-200 leading-relaxed font-light">
            {activeTab === "STORY" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                  The Cultural Lineage of {product.title}
                </h3>
                <p>{product.culturalStory}</p>
                <p>{product.description}</p>
                <blockquote className="border-l-2 border-gold-500 pl-4 py-1 italic font-serif text-charcoal-800 text-base">
                  &ldquo;Every knot is tied with generational memory. When you carry Preheritage, you keep this flame alive.&rdquo;
                </blockquote>
              </div>
            )}

            {activeTab === "FABRIC" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                  Authentic Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="p-4 bg-ivory-100 rounded border border-ivory-200">
                    <span className="font-semibold text-charcoal-900 block mb-1">Fabric Composition</span>
                    <span>{product.fabricDetails}</span>
                  </div>
                  <div className="p-4 bg-ivory-100 rounded border border-ivory-200">
                    <span className="font-semibold text-charcoal-900 block mb-1">Dimensions & Fit</span>
                    <span>{product.sizeFitGuide}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "CARE" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                  Preserving Your Creation for Generations
                </h3>
                <p>{product.careInstructions}</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Store in breathable unbleached muslin bags provided with the order.</li>
                  <li>Do not spray perfumes directly on metallic gold zari.</li>
                  <li>Refold every 3 months along different crease lines to preserve silk resilience.</li>
                </ul>
              </div>
            )}

            {activeTab === "SHIPPING" && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                  Shiprocket Logistics & Insured Delivery
                </h3>
                <p>
                  Every order is packed in our signature royal ivory packaging with wax seal protection and handed to premier courier partners (Delhivery, Bluedart, or Shiprocket Priority).
                </p>
                <p>
                  Domestic transit takes 2-4 business days. International transit takes 5-7 business days via DHL Express. 7-day hassle-free reverse pickup available for sizing exchanges.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <div className="mt-12 bg-ivory-50 rounded-sm border border-ivory-300 p-6 sm:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-ivory-300 gap-4">
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
                Patron Reviews & Photographs
              </h3>
              <p className="text-xs text-charcoal-100 mt-1">
                Verified reviews from collectors who own this piece
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-serif font-bold text-charcoal-900">{product.rating}</div>
              <div>
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>
                <div className="text-[11px] text-charcoal-100">Based on {reviews.length} reviews</div>
              </div>
            </div>
          </div>

          {/* Existing reviews */}
          <div className="divide-y divide-ivory-200 py-6 space-y-6">
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
            <form onSubmit={handleAddReview} className="space-y-4 max-w-xl">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-400 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    placeholder="e.g. Radhika M."
                    className="w-full bg-white border border-ivory-300 px-3 py-2 text-xs rounded focus:outline-none focus:border-gold-500"
                  />
                </div>
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
          </div>
        </div>

        {/* Related Heritage Creations */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-end mb-8">
              <div>
                <span className="text-xs uppercase tracking-[0.24em] text-gold-600 font-semibold font-sans block mb-1">
                  Complete the Royal Ensemble
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
                  Related Heritage Treasures
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

      {/* Size Chart Modal */}
      {isSizeChartOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ivory-50 max-w-lg w-full p-6 sm:p-8 rounded-sm shadow-2xl border border-ivory-300">
            <div className="flex justify-between items-center pb-4 border-b border-ivory-300 mb-4">
              <h3 className="font-serif text-xl font-bold text-charcoal-900">Preheritage Standard Size Guide</h3>
              <button
                onClick={() => setIsSizeChartOpen(false)}
                className="text-charcoal-200 hover:text-charcoal-900 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left divide-y divide-ivory-300">
                <thead>
                  <tr className="bg-ivory-200 text-charcoal-900 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">Bust (in)</th>
                    <th className="p-2.5">Waist (in)</th>
                    <th className="p-2.5">Hip (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200 text-charcoal-800">
                  <tr><td className="p-2.5 font-bold">S</td><td className="p-2.5">34-36</td><td className="p-2.5">28-30</td><td className="p-2.5">37-39</td></tr>
                  <tr><td className="p-2.5 font-bold">M</td><td className="p-2.5">36-38</td><td className="p-2.5">30-32</td><td className="p-2.5">39-41</td></tr>
                  <tr><td className="p-2.5 font-bold">L</td><td className="p-2.5">38-40</td><td className="p-2.5">32-34</td><td className="p-2.5">41-43</td></tr>
                  <tr><td className="p-2.5 font-bold">XL</td><td className="p-2.5">40-42</td><td className="p-2.5">34-36</td><td className="p-2.5">43-45</td></tr>
                  <tr><td className="p-2.5 font-bold">XXL</td><td className="p-2.5">42-44</td><td className="p-2.5">36-38</td><td className="p-2.5">45-47</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-charcoal-100 mt-4 font-light">
              * Note: Sarees are Free Size (5.5m + 0.8m blouse piece). Custom tailor sizing is available on request via WhatsApp Concierge.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
