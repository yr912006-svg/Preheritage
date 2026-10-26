"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Check, Sparkles, Image as ImageIcon } from "lucide-react";
import { CATEGORIES, REGIONS } from "@/lib/sample-data";
import { INDIAN_STATES, slugify } from "@/lib/utils";

export default function NewProductPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sku, setSku] = useState(`PRE-SAR-${Math.floor(100 + Math.random() * 900)}`);
  const [category, setCategory] = useState("sarees");
  const [region, setRegion] = useState("varanasi");
  const [state, setState] = useState("Uttar Pradesh");
  const [price, setPrice] = useState(24999);
  const [mrp, setMrp] = useState(31999);
  const [costPrice, setCostPrice] = useState(14500);
  const [stock, setStock] = useState(10);
  const [shortDesc, setShortDesc] = useState("Handwoven masterpiece celebrating royal Indian lineage.");
  const [description, setDescription] = useState("");
  const [culturalStory, setCulturalStory] = useState("");
  const [fabricDetails, setFabricDetails] = useState("100% Pure Mulberry Silk (Silk Mark Certified), Tested Gold Zari");
  const [careInstructions, setCareInstructions] = useState("Dry clean only. Store in unbleached muslin wrap.");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200");
  const [isFeatured, setIsFeatured] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadError("");
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/storage/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image upload failed.");
      setImageUrl(result.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      router.push("/admin/products");
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 bg-ivory-50 border border-ivory-300 rounded text-charcoal-800 hover:text-charcoal-950"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-charcoal-900">
            Add New Handcrafted Heirloom
          </h1>
          <p className="text-xs text-charcoal-100 font-light">
            Catalogue a new creation with certified GI lineage and artisan narratives
          </p>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Product successfully created and added to PREHERITAGE catalog!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Core Details */}
        <div className="bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-200">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-charcoal-400 font-semibold mb-1">Creation Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Varanasi Kadwa Katan Silk Saree in Antique Gold"
                className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-serif text-sm"
              />
            </div>
            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">SKU Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Craft Region *</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.slug}>
                    {r.name} ({r.craft})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Origin State *</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-charcoal-400 font-semibold mb-1">Short Description</label>
            <input
              type="text"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="One line essence of the garment"
              className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Pricing & Margins */}
        <div className="bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-200">
            2. Pricing & Financials (INR)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">MRP / Stated Price (₹)</label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(Number(e.target.value))}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Artisan Cost Price (₹)</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
              />
            </div>

            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Gross Margin (%)</label>
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded">
                {price > costPrice ? `${Math.round(((price - costPrice) / price) * 100)}%` : "0%"}
              </div>
            </div>
          </div>
        </div>

        {/* Media & High-Res Photography */}
        <div className="bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-200">
            3. Product Imagery & Lookbook (Neon Object Storage)
          </h2>

          <div>
            <label className="block text-charcoal-400 font-semibold mb-1">Upload a product image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              disabled={isUploading}
              onChange={(event) => void handleImageUpload(event.target.files?.[0])}
              className="w-full bg-white border border-ivory-300 p-2.5 rounded"
            />
            {isUploading && <p className="mt-2 text-charcoal-400">Uploading image…</p>}
            {uploadError && <p role="alert" className="mt-2 text-red-700">{uploadError}</p>}
          </div>

          <div>
            <label className="block text-charcoal-400 font-semibold mb-1">Primary High-Res Image URL or uploaded object path</label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500 font-mono"
            />
          </div>
        </div>

        {/* Cultural Narrative & Lineage */}
        <div className="bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-200">
            4. Cultural Story & Artisan Origin
          </h2>

          <div>
            <label className="block text-charcoal-400 font-semibold mb-1">The Craft Narrative</label>
            <textarea
              rows={3}
              value={culturalStory}
              onChange={(e) => setCulturalStory(e.target.value)}
              placeholder="Historical background, pit loom technique, generational family lineage..."
              className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Fabric Specifications</label>
              <input
                type="text"
                value={fabricDetails}
                onChange={(e) => setFabricDetails(e.target.value)}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded"
              />
            </div>
            <div>
              <label className="block text-charcoal-400 font-semibold mb-1">Care Guide</label>
              <input
                type="text"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                className="w-full bg-white border border-ivory-300 p-2.5 rounded"
              />
            </div>
          </div>
        </div>

        {/* Launch Switches */}
        <div className="bg-ivory-50 p-6 rounded-sm border border-ivory-300 shadow-sm flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-charcoal-900">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="text-gold-600 rounded"
            />
            <span>Feature on Homepage</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-charcoal-900">
            <input
              type="checkbox"
              checked={isBestseller}
              onChange={(e) => setIsBestseller(e.target.checked)}
              className="text-gold-600 rounded"
            />
            <span>Mark as Royal Bestseller</span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/products"
            className="px-6 py-3 bg-ivory-200 text-charcoal-900 text-xs uppercase tracking-wider font-semibold rounded hover:bg-ivory-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-8 py-3 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold rounded transition-colors shadow-luxury"
          >
            Publish to Storefront
          </button>
        </div>
      </form>
    </div>
  );
}
