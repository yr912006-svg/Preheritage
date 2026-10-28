"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, X, ChevronUp, ChevronDown, Star } from "lucide-react";
import { CATEGORIES, REGIONS } from "@/lib/sample-data";
import { slugify } from "@/lib/utils";

export default function NewProductPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("sarees");
  const [region, setRegion] = useState("varanasi");
  const [price, setPrice] = useState(0);
  const [mrp, setMrp] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [culturalStory, setCulturalStory] = useState("");
  const [fabricDetails, setFabricDetails] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [sizesInput, setSizesInput] = useState("");
  const [images, setImages] = useState<{ url: string; status: "uploading" | "uploaded" | "failed"; error?: string }[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleImageUpload = async (fileList?: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    setUploadError("");
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) { setUploadError("Choose JPEG, PNG, or WebP images."); return; }
    if (files.some((file) => file.size === 0 || file.size > 10 * 1024 * 1024)) { setUploadError("Each image must be smaller than 10 MB."); return; }
    const start = images.length;
    setImages((current) => [...current, ...files.map(() => ({ url: "", status: "uploading" as const }))]);
    setIsUploading(true);
    try {
      const form = new FormData(); files.forEach((file) => form.append("files", file));
      const response = await fetch("/api/storage/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image upload failed.");
      setImages((current) => { const next = [...current]; result.uploads.forEach((upload: { url: string }, index: number) => { next[start + index] = { url: upload.url, status: "uploaded" }; }); return next; });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image upload failed.";
      setImages((current) => current.map((image, index) => index >= start && index < start + files.length ? { ...image, status: "failed", error: message } : image));
      setUploadError(message);
    } finally { setIsUploading(false); }
  };
  const moveImage = (index: number, delta: number) => setImages((current) => { const target = index + delta; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; setPrimaryImageIndex((primary) => primary === index ? target : primary === target ? index : primary); return next; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError("");
    try {
      const uploadedImages = images.map((image, index) => ({ image, index })).filter(({ image }) => image.status === "uploaded");
      const submittedPrimaryIndex = Math.max(0, uploadedImages.findIndex(({ index }) => index === primaryImageIndex));
      const response = await fetch("/api/admin/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sku, category, region, price, mrp, costPrice, stock, shortDesc, description, culturalStory, fabricDetails, careInstructions, sizes: sizesInput.split(",").map((size) => size.trim()).filter(Boolean), images: uploadedImages.map(({ image }) => image.url), primaryImageIndex: submittedPrimaryIndex, isFeatured, isBestSeller: isBestseller }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Product could not be created.");
      setIsSaved(true);
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Product could not be created.");
    } finally {
      setIsSaving(false);
    }
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
      {saveError && <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">{saveError}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Core Details */}
        <div className="bg-ivory-50 p-6 sm:p-8 rounded-sm border border-ivory-300 shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-charcoal-900 pb-3 border-b border-ivory-200">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-charcoal-400 font-semibold mb-1">Product Description *</label>
            <textarea rows={4} required minLength={10} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the materials, construction, fit, and key product details." className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500" />
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
            <label className="block text-charcoal-400 font-semibold mb-1">Upload product images (JPEG, PNG or WebP, up to 10 MB each)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => { void handleImageUpload(event.target.files); event.currentTarget.value = ""; }}
              className="w-full bg-white border border-ivory-300 p-2.5 rounded"
            />
            {isUploading && <p className="mt-2 text-charcoal-400">Uploading image…</p>}
            {uploadError && <p role="alert" className="mt-2 text-red-700">{uploadError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{images.map((image, index) => <div key={`${index}-${image.url}`} className="overflow-hidden rounded border border-ivory-300 bg-white"><div className="relative aspect-[3/4] bg-ivory-200">{image.url && <Image src={image.url} alt={`Product image ${index + 1}`} fill unoptimized className="object-cover" />}{image.status === "uploading" && <span className="absolute inset-0 grid place-items-center bg-white/80">Uploading…</span>}{image.status === "failed" && <span className="absolute inset-0 grid place-items-center bg-rose-50 p-2 text-center text-rose-700">{image.error || "Upload failed"}</span>}{primaryImageIndex === index && image.status === "uploaded" && <span className="absolute left-2 top-2 rounded bg-gold-600 px-2 py-1 text-[10px] font-bold text-white">Primary</span>}</div><div className="flex items-center justify-between p-2"><button type="button" onClick={() => setPrimaryImageIndex(index)} disabled={image.status !== "uploaded"} aria-label="Set primary image"><Star className={`h-4 w-4 ${primaryImageIndex === index ? "fill-gold-600 text-gold-600" : ""}`} /></button><button type="button" onClick={() => moveImage(index, -1)} aria-label="Move image earlier"><ChevronUp className="h-4 w-4" /></button><button type="button" onClick={() => moveImage(index, 1)} aria-label="Move image later"><ChevronDown className="h-4 w-4" /></button><button type="button" onClick={() => { setImages((current) => current.filter((_, itemIndex) => itemIndex !== index)); setPrimaryImageIndex((current) => current === index ? 0 : current > index ? current - 1 : current); }} aria-label="Remove image"><X className="h-4 w-4 text-rose-700" /></button></div></div>)}</div>
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

          <div>
            <label className="block text-charcoal-400 font-semibold mb-1">Available Sizes</label>
            <input type="text" value={sizesInput} onChange={(e) => setSizesInput(e.target.value)} placeholder="For example: S, M, L, XL (leave blank for Free Size)" className="w-full bg-white border border-ivory-300 p-2.5 rounded focus:outline-none focus:border-gold-500" />
            <p className="mt-1 text-[11px] text-charcoal-400">Separate size options with commas. Each size is saved as a purchasable variant with the product stock.</p>
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
            disabled={isUploading || isSaving || !images.some((image) => image.status === "uploaded")}
            className="px-8 py-3 bg-charcoal-900 hover:bg-gold-600 text-ivory-50 text-xs uppercase tracking-widest font-semibold rounded transition-colors shadow-luxury disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Publish to Storefront"}
          </button>
        </div>
      </form>
    </div>
  );
}
