"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, RefreshCw, Trash2, CheckCircle2, AlertCircle, Eye, Edit3, ArrowRight } from "lucide-react";
import type { HeritagePhilosophyContent } from "@/lib/heritage-philosophy";
import { DEFAULT_HERITAGE_PHILOSOPHY } from "@/lib/heritage-philosophy";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  tagline: string | null;
  priority: number;
  position?: string | null;
  isActive: boolean;
};

type Poster = {
  id: string;
  title: string;
  theme: string;
  imageUrl: string;
  description: string | null;
  isPublished: boolean;
  orderIndex: number;
};

type CategoryContent = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  imageAlt?: string | null;
  focalPoint?: string | null;
  orderIndex: number;
};

const getObjectPositionStyle = (focal?: string | null) => {
  switch (focal?.toLowerCase()) {
    case "top":
      return "center top";
    case "bottom":
      return "center bottom";
    case "left":
      return "left center";
    case "right":
      return "right center";
    case "center":
    default:
      return "center center";
  }
};

type Kind = "banner" | "poster";

type Draft = {
  id: string;
  type: Kind;
  title: string;
  imageUrl: string;
  subtitle: string;
  tagline: string;
  link: string;
  priority: number;
  position: string;
  theme: string;
  description: string;
  isActive: boolean;
  isPublished: boolean;
};

const blank = (type: Kind): Draft => ({
  id: "",
  type,
  title: "",
  imageUrl: "",
  subtitle: "",
  tagline: "",
  link: "",
  priority: 0,
  position: "RIGHT",
  theme: "",
  description: "",
  isActive: true,
  isPublished: false,
});

const inputClass = "w-full rounded border border-ivory-300 bg-white p-2.5 text-sm text-charcoal-900 focus:border-gold-500 focus:outline-none";
const buttonClass = "rounded border border-ivory-400 px-3 py-2 text-xs font-semibold text-charcoal-800 hover:border-gold-600 disabled:opacity-50 transition-colors";

function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/api/storage/products/") || trimmed.startsWith("/images/")) return true;
  try {
    return new URL(trimmed).protocol === "https:";
  } catch {
    return false;
  }
}

export default function ContentDashboard() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [philosophy, setPhilosophy] = useState<HeritagePhilosophyContent>(DEFAULT_HERITAGE_PHILOSOPHY);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Philosophy-specific edit state
  const [editingPhilosophy, setEditingPhilosophy] = useState(false);
  const [philosophyDraft, setPhilosophyDraft] = useState<HeritagePhilosophyContent>(DEFAULT_HERITAGE_PHILOSOPHY);
  const [philosophyFileName, setPhilosophyFileName] = useState("");
  const [philosophyPreview, setPhilosophyPreview] = useState("");
  const [philosophyUploading, setPhilosophyUploading] = useState(false);
  const [philosophyUploadProgress, setPhilosophyUploadProgress] = useState(0);
  const philosophyFileInputRef = useRef<HTMLInputElement>(null);

  // Category-specific edit state
  const [categories, setCategories] = useState<CategoryContent[]>([]);
  const [editingCategory, setEditingCategory] = useState<CategoryContent | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<{
    id: string;
    name: string;
    slug: string;
    image: string;
    imageAlt: string;
    focalPoint: string;
  }>({
    id: "",
    name: "",
    slug: "",
    image: "",
    imageAlt: "",
    focalPoint: "center",
  });
  const [categoryFileName, setCategoryFileName] = useState("");
  const [categoryPreview, setCategoryPreview] = useState("");
  const [categoryUploading, setCategoryUploading] = useState(false);
  const [categoryUploadProgress, setCategoryUploadProgress] = useState(0);
  const [categorySaving, setCategorySaving] = useState(false);
  const [previewingCategory, setPreviewingCategory] = useState<CategoryContent | null>(null);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load content.");
      setBanners(data.banners || []);
      setPosters(data.posters || []);
      if (data.philosophy) {
        setPhilosophy(data.philosophy);
      }
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
      if (philosophyPreview.startsWith("blob:")) URL.revokeObjectURL(philosophyPreview);
      if (categoryPreview.startsWith("blob:")) URL.revokeObjectURL(categoryPreview);
    };
  }, [preview, philosophyPreview]);

  const resetFormState = () => {
    setSelectedFileName("");
    setPreview("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const editBanner = (banner?: Banner) => {
    resetFormState();
    const next = blank("banner");
    if (banner) {
      Object.assign(next, {
        id: banner.id,
        title: banner.title,
        imageUrl: banner.imageUrl,
        subtitle: banner.subtitle || "",
        tagline: banner.tagline || "",
        link: banner.link || "",
        priority: banner.priority,
        position: banner.position || "RIGHT",
        isActive: banner.isActive,
      });
    }
    setDraft(next);
    setPreview(next.imageUrl);
    setError("");
    setNotice("");
  };

  const editPoster = (poster?: Poster) => {
    resetFormState();
    const next = blank("poster");
    if (poster) {
      Object.assign(next, {
        id: poster.id,
        title: poster.title,
        theme: poster.theme,
        imageUrl: poster.imageUrl,
        description: poster.description || "",
        isPublished: poster.isPublished,
      });
    }
    setDraft(next);
    setPreview(next.imageUrl);
    setError("");
    setNotice("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !draft) return;

    setError("");
    setNotice("");
    setSelectedFileName(file.name);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a valid JPEG, PNG, WebP, or AVIF image file.");
      return;
    }

    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      setError("Image file size must be between 1 KB and 10 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    setUploadProgress(20);

    try {
      const form = new FormData();
      form.append("file", file);

      setUploadProgress(50);
      const response = await fetch("/api/admin/content/upload", {
        method: "POST",
        body: form,
      });

      setUploadProgress(85);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      setDraft((current) => (current ? { ...current, imageUrl: data.url } : current));
      setPreview(data.url);
      setUploadProgress(100);
      setNotice(`Image "${file.name}" uploaded successfully and ready to save.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFileName("");
    setPreview("");
    if (draft) {
      setDraft({ ...draft, imageUrl: "" });
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;

    if (uploading) {
      setError("Please wait for the image upload to complete before saving.");
      return;
    }

    if (!isValidImageUrl(draft.imageUrl)) {
      setError("Please upload an image or provide a valid image URL before saving this banner.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload =
        draft.type === "banner"
          ? {
              type: draft.type,
              id: draft.id || undefined,
              title: draft.title,
              imageUrl: draft.imageUrl,
              subtitle: draft.subtitle || null,
              tagline: draft.tagline || null,
              link: draft.link || null,
              priority: Number(draft.priority),
              position: draft.position || "RIGHT",
              isActive: draft.isActive,
            }
          : {
              type: draft.type,
              id: draft.id || undefined,
              title: draft.title,
              theme: draft.theme,
              imageUrl: draft.imageUrl,
              description: draft.description || null,
              isPublished: draft.isPublished,
            };

      const response = await fetch("/api/admin/content", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save content.");

      setDraft(null);
      resetFormState();
      setNotice(`${draft.type === "banner" ? "Banner" : "Art poster"} saved successfully and synchronized to the storefront.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save content.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (type: Kind, record: Banner | Poster) => {
    setError("");
    setNotice("");
    const body =
      type === "banner"
        ? { type, id: record.id, isActive: !(record as Banner).isActive }
        : { type, id: record.id, isPublished: !(record as Poster).isPublished };

    try {
      const response = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not update status.");
      setNotice(`${type === "banner" ? "Banner" : "Poster"} status updated successfully.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update status.");
    }
  };

  // Heritage Philosophy handlers
  const startEditPhilosophy = () => {
    setPhilosophyDraft({ ...philosophy });
    setPhilosophyPreview(philosophy.imageUrl || "");
    setPhilosophyFileName("");
    setPhilosophyUploadProgress(0);
    setEditingPhilosophy(true);
    setError("");
    setNotice("");
  };

  const cancelEditPhilosophy = () => {
    setEditingPhilosophy(false);
    setPhilosophyFileName("");
    setPhilosophyPreview("");
    if (philosophyFileInputRef.current) philosophyFileInputRef.current.value = "";
  };

  const handlePhilosophyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setNotice("");
    setPhilosophyFileName(file.name);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a valid JPEG, PNG, WebP, or AVIF image file.");
      return;
    }

    if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
      setError("Image file size must be between 1 KB and 10 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPhilosophyPreview(objectUrl);
    setPhilosophyUploading(true);
    setPhilosophyUploadProgress(20);

    try {
      const form = new FormData();
      form.append("file", file);

      setPhilosophyUploadProgress(50);
      const response = await fetch("/api/admin/content/upload", {
        method: "POST",
        body: form,
      });

      setPhilosophyUploadProgress(85);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Image upload failed.");
      }

      setPhilosophyDraft((current) => ({ ...current, imageUrl: data.url }));
      setPhilosophyPreview(data.url);
      setPhilosophyUploadProgress(100);
      setNotice(`Philosophy image "${file.name}" uploaded successfully and ready to save.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Image upload failed.");
    } finally {
      setPhilosophyUploading(false);
    }
  };

  const handleRemovePhilosophyImage = () => {
    if (philosophyFileInputRef.current) philosophyFileInputRef.current.value = "";
    setPhilosophyFileName("");
    setPhilosophyPreview("");
    setPhilosophyDraft((cur) => ({ ...cur, imageUrl: "" }));
  };

  const submitPhilosophy = async (event: React.FormEvent) => {
    event.preventDefault();

    if (philosophyUploading) {
      setError("Please wait for the image upload to complete before saving.");
      return;
    }

    if (!isValidImageUrl(philosophyDraft.imageUrl)) {
      setError("Please upload an image or provide a valid image URL for the philosophy section.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        type: "philosophy",
        ...philosophyDraft,
      };

      const response = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save heritage philosophy section.");

      setPhilosophy(data.record || philosophyDraft);
      setEditingPhilosophy(false);
      setPhilosophyFileName("");
      setNotice("Heritage Philosophy Section saved successfully and synchronized to the storefront.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save heritage philosophy section.");
    } finally {
      setSaving(false);
    }
  };

  // Category handlers
  const startEditCategory = (cat: CategoryContent) => {
    setEditingCategory(cat);
    setCategoryDraft({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image || "",
      imageAlt: cat.imageAlt || `${cat.name} collection - PREHERITAGE`,
      focalPoint: cat.focalPoint || "center",
    });
    setCategoryPreview(cat.image || "");
    setCategoryFileName("");
    setCategoryUploadProgress(0);
    setError("");
  };

  const cancelEditCategory = () => {
    if (categoryPreview.startsWith("blob:")) {
      URL.revokeObjectURL(categoryPreview);
    }
    setEditingCategory(null);
    setCategoryFileName("");
    setCategoryPreview("");
    setCategoryUploadProgress(0);
  };

  const handleCategoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image (JPEG, PNG, WebP, or AVIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image file is too large (maximum 10 MB).");
      return;
    }

    setCategoryFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setCategoryPreview(objectUrl);
    setCategoryUploading(true);
    setCategoryUploadProgress(20);
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);
      setCategoryUploadProgress(50);
      const res = await fetch("/api/admin/content/upload", {
        method: "POST",
        body: form,
      });
      setCategoryUploadProgress(85);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to upload image.");
        setCategoryUploading(false);
        return;
      }
      setCategoryDraft((current) => ({ ...current, image: data.url }));
      setCategoryPreview(data.url);
      setCategoryUploadProgress(100);
      setNotice(`Category image "${file.name}" uploaded successfully and ready to save.`);
    } catch {
      setError("Failed to upload image. Please check storage connection and try again.");
    } finally {
      setCategoryUploading(false);
    }
  };

  const submitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryDraft.id) return;
    if (!categoryDraft.image.trim()) {
      setError("Please provide an image URL or upload an image for this category.");
      return;
    }

    setCategorySaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: categoryDraft.id,
          image: categoryDraft.image.trim(),
          imageAlt: categoryDraft.imageAlt.trim() || null,
          focalPoint: categoryDraft.focalPoint.trim() || "center",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to save category image.");
        setCategorySaving(false);
        return;
      }

      setCategories((prev) =>
        prev.map((c) => (c.id === data.record.id ? { ...c, ...data.record } : c))
      );
      setEditingCategory(null);
      setNotice(`Category image for "${categoryDraft.name}" saved successfully and synchronized to the homepage.`);
      await load();
    } catch {
      setError("An unexpected error occurred while saving the category image.");
    } finally {
      setCategorySaving(false);
    }
  };

  const card = "rounded border border-ivory-300 bg-ivory-50 p-4";

  const renderForm = draft && (
    <form onSubmit={submit} className="grid gap-4 rounded border border-gold-300 bg-ivory-50 p-5 sm:grid-cols-2 shadow-xs">
      <div className="sm:col-span-2 flex items-center justify-between border-b border-ivory-300 pb-3">
        <h2 className="font-serif text-xl font-bold text-charcoal-900">
          {draft.id ? "Edit" : "Add"} {draft.type === "banner" ? "Homepage Banner" : "Art Poster"}
        </h2>
        <button
          type="button"
          disabled={uploading || saving}
          className={buttonClass}
          onClick={() => {
            setDraft(null);
            resetFormState();
          }}
        >
          Cancel
        </button>
      </div>

      {/* Banner Title */}
      <label className="space-y-1 text-xs font-semibold text-charcoal-900">
        Banner Title *
        <input
          required
          maxLength={180}
          className={inputClass}
          value={draft.title}
          placeholder="e.g. Many Stories. One Thread."
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </label>

      {/* Poster Theme (only if poster) */}
      {draft.type === "poster" && (
        <label className="space-y-1 text-xs font-semibold text-charcoal-900">
          Theme *
          <input
            required
            maxLength={120}
            className={inputClass}
            value={draft.theme}
            onChange={(event) => setDraft({ ...draft, theme: event.target.value })}
          />
        </label>
      )}

      {/* Image Focal Point / Position (only for banner) */}
      {draft.type === "banner" && (
        <label className="space-y-1 text-xs font-semibold text-charcoal-900">
          Focal Point / Image Alignment
          <select
            className={inputClass}
            value={draft.position}
            onChange={(event) => setDraft({ ...draft, position: event.target.value })}
          >
            <option value="RIGHT">Right (Recommended for Couture Model / Saree Campaign)</option>
            <option value="CENTER">Center (Balanced / Panoramic)</option>
            <option value="LEFT">Left (Focal Subject on Left)</option>
          </select>
        </label>
      )}

      {/* Subtitle / Description */}
      {draft.type === "banner" && (
        <label className="space-y-1 text-xs font-semibold text-charcoal-900 sm:col-span-2">
          Subtitle / Narrative Description
          <textarea
            rows={2}
            maxLength={500}
            className={inputClass}
            value={draft.subtitle}
            placeholder="Discover India's living textile heritage, woven by master artisans."
            onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })}
          />
        </label>
      )}

      {/* Image Management Section */}
      <div className="sm:col-span-2 space-y-3 rounded border border-ivory-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-charcoal-900">Banner Photography *</span>
            <p className="text-[11px] text-charcoal-500">
              Upload a high-resolution campaign image (JPEG, PNG, WebP, AVIF up to 10 MB).
            </p>
          </div>

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded bg-charcoal-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-gold-600 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{preview ? "Replace Image" : "Upload Image"}</span>
            </button>

            {preview && (
              <button
                type="button"
                disabled={uploading}
                onClick={handleRemoveImage}
                className="inline-flex items-center gap-1.5 rounded border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                title="Remove selected image"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected file feedback & progress */}
        {selectedFileName && (
          <div className="flex items-center gap-2 text-xs text-charcoal-700">
            <span className="font-semibold">Selected file:</span>
            <span className="font-mono text-[11px] bg-ivory-100 px-2 py-0.5 rounded border border-ivory-300">
              {selectedFileName}
            </span>
            {uploading && (
              <span className="text-gold-700 font-semibold animate-pulse inline-flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> Uploading ({uploadProgress}%)...
              </span>
            )}
          </div>
        )}

        {/* Image Preview Box */}
        {preview ? (
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded border border-ivory-300 bg-ivory-100">
            <Image
              src={preview}
              alt="Banner preview"
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute bottom-2 right-2 rounded bg-charcoal-900/80 px-2.5 py-1 text-[10px] font-medium text-ivory-100 backdrop-blur-xs flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>Preview (Focal: {draft.type === "banner" ? draft.position : "Default"})</span>
            </div>
          </div>
        ) : (
          <div className="flex h-36 w-full flex-col items-center justify-center rounded border-2 border-dashed border-ivory-300 bg-ivory-50 text-charcoal-400">
            <Upload className="w-6 h-6 mb-1 text-charcoal-300" />
            <span className="text-xs font-medium">No image selected</span>
            <span className="text-[10px] text-charcoal-400">Click &ldquo;Upload Image&rdquo; above or enter an Image URL below</span>
          </div>
        )}

        {/* Alternative Direct Image URL */}
        <label className="block text-[11px] font-semibold text-charcoal-600">
          Or specify Image URL directly:
          <input
            className={`${inputClass} mt-1 font-mono text-xs`}
            value={draft.imageUrl}
            placeholder="/images/... or /api/storage/products/... or https://..."
            onChange={(e) => {
              const url = e.target.value;
              setDraft({ ...draft, imageUrl: url });
              setPreview(url);
            }}
          />
        </label>
      </div>

      {draft.type === "banner" ? (
        <>
          <label className="space-y-1 text-xs font-semibold text-charcoal-900">
            Primary CTA Button Text
            <input
              maxLength={120}
              className={inputClass}
              value={draft.tagline}
              placeholder="e.g. Explore the Collection"
              onChange={(event) => setDraft({ ...draft, tagline: event.target.value })}
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-charcoal-900">
            Primary CTA Destination URL
            <input
              maxLength={2048}
              className={inputClass}
              value={draft.link}
              onChange={(event) => setDraft({ ...draft, link: event.target.value })}
              placeholder="/shop or /collections"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-charcoal-900">
            Display Order (lower numbers appear first)
            <input
              type="number"
              min="0"
              max="100000"
              required
              className={inputClass}
              value={draft.priority}
              onChange={(event) => setDraft({ ...draft, priority: Number(event.target.value) })}
            />
          </label>

          <div className="flex items-center gap-2 pt-6">
            <label className="flex items-center gap-2 text-xs font-bold text-charcoal-900 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-ivory-400 text-gold-600 focus:ring-gold-500"
                checked={draft.isActive}
                onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
              />
              <span>Set as Active Banner on Homepage</span>
            </label>
          </div>
        </>
      ) : (
        <>
          <label className="space-y-1 text-xs font-semibold text-charcoal-900 sm:col-span-2">
            Description
            <textarea
              rows={3}
              maxLength={2000}
              className={inputClass}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-900">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-ivory-400 text-gold-600 focus:ring-gold-500"
              checked={draft.isPublished}
              onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })}
            />
            Published
          </label>
        </>
      )}

      <div className="sm:col-span-2 pt-2 border-t border-ivory-200">
        <button
          disabled={saving || uploading}
          className="rounded bg-charcoal-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-ivory-50 hover:bg-gold-600 transition-colors disabled:opacity-50 shadow-xs"
        >
          {uploading ? "Uploading image..." : saving ? "Saving to Storefront..." : "Save Content"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-9">
      <header>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-700">Storefront presentation</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-charcoal-900">Banners &amp; Content</h1>
        <p className="mt-1 text-sm text-charcoal-500">
          Upload, manage, and synchronize homepage hero campaign photography, art posters, and brand philosophy.
        </p>
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {renderForm}

      {loading ? (
        <p className={card + " text-sm text-charcoal-500"}>Loading saved content...</p>
      ) : (
        <>
          {/* Section 1: Homepage Banners List */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-xl font-bold text-charcoal-900">
                Homepage Banners <span className="text-sm font-normal text-charcoal-500">({banners.length} saved)</span>
              </h2>
              <button
                disabled={uploading}
                className={buttonClass}
                onClick={() => editBanner()}
              >
                + Add New Banner
              </button>
            </div>

            {banners.length ? (
              <div className="grid gap-3">
                {banners.map((banner) => (
                  <article
                    key={banner.id}
                    className={`${card} flex flex-col gap-4 sm:flex-row sm:items-center transition-all hover:border-gold-400`}
                  >
                    {/* Saved Image Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden rounded bg-ivory-200 sm:w-44 shrink-0 border border-ivory-300">
                      <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>

                    {/* Banner Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-charcoal-900">{banner.title}</h3>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            banner.isActive
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-charcoal-100 text-charcoal-600 border border-charcoal-200"
                          }`}
                        >
                          {banner.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {banner.subtitle && (
                        <p className="mt-1 text-xs text-charcoal-600 line-clamp-1 italic">
                          {banner.subtitle}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-charcoal-500">
                        <span>Order: {banner.priority}</span>
                        {banner.position && <span> · Focal: {banner.position}</span>}
                        {banner.tagline && <span> · CTA: &ldquo;{banner.tagline}&rdquo;</span>}
                        {banner.link && <span> &rarr; {banner.link}</span>}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={uploading}
                        className={buttonClass}
                        onClick={() => editBanner(banner)}
                      >
                        Edit
                      </button>

                      <button
                        disabled={uploading}
                        className={`${buttonClass} ${
                          banner.isActive
                            ? "hover:border-rose-400 hover:text-rose-700"
                            : "hover:border-emerald-400 hover:text-emerald-700"
                        }`}
                        onClick={() => void toggle("banner", banner)}
                      >
                        {banner.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={card + " text-sm text-charcoal-500"}>No saved banners yet. Add one to get started.</p>
            )}
          </section>

          {/* Section 2: Posters List */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-xl font-bold text-charcoal-900">
                Art Posters <span className="text-sm font-normal text-charcoal-500">({posters.length} saved)</span>
              </h2>
              <button
                disabled={uploading}
                className={buttonClass}
                onClick={() => editPoster()}
              >
                + Add Art Poster
              </button>
            </div>

            {posters.length ? (
              <div className="grid gap-3">
                {posters.map((poster) => (
                  <article key={poster.id} className={`${card} flex flex-col gap-3 sm:flex-row sm:items-center`}>
                    <div className="relative aspect-video w-full overflow-hidden rounded bg-ivory-200 sm:w-36 shrink-0 border border-ivory-300">
                      <Image src={poster.imageUrl} alt={poster.title} fill unoptimized className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-charcoal-900">{poster.title}</h3>
                      <p className="mt-1 text-xs text-charcoal-500">
                        {poster.theme}
                        {poster.description ? ` · ${poster.description}` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        poster.isPublished ? "text-emerald-700" : "text-charcoal-500"
                      }`}
                    >
                      {poster.isPublished ? "Published" : "Unpublished"}
                    </span>
                    <button disabled={uploading} className={buttonClass} onClick={() => editPoster(poster)}>
                      Edit
                    </button>
                    <button
                      disabled={uploading}
                      className={buttonClass}
                      onClick={() => void toggle("poster", poster)}
                    >
                      {poster.isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className={card + " text-sm text-charcoal-500"}>No saved art posters yet. Add one to get started.</p>
            )}
          </section>

          {/* Section 3: Shop by Category */}
          <section className="space-y-4 pt-4 border-t border-ivory-300">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-charcoal-900">
                  Shop by Category <span className="text-sm font-normal text-charcoal-500">({categories.length} categories)</span>
                </h2>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Manage homepage category cards, editorial imagery, accessibility alt text, and framing focal points.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/admin/catalog"
                  className="inline-flex items-center gap-1.5 rounded border border-ivory-300 bg-white px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:border-gold-500 hover:text-gold-700 transition-colors"
                  title="Configure taxonomies, subcategories, and category records in the catalogue system"
                >
                  <span>Catalogue Taxonomy</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Editing Form for Category Image */}
            {editingCategory && (
              <div className={`${card} border-2 border-gold-400 bg-ivory-50/50 p-6 rounded-md shadow-luxury`}>
                <div className="flex items-center justify-between pb-4 border-b border-ivory-300 mb-6">
                  <div>
                    <span className="text-[10px] tracking-widest uppercase text-gold-600 font-bold block mb-1">
                      Editing Category Imagery
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                      {categoryDraft.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={cancelEditCategory}
                    className="text-xs text-charcoal-500 hover:text-charcoal-900 p-1"
                  >
                    ✕ Close
                  </button>
                </div>

                <form onSubmit={submitCategory} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Live Category Card Preview (Left) */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                      <span className="text-xs font-semibold text-charcoal-700 mb-2 uppercase tracking-wider block">
                        Homepage Live Preview
                      </span>
                      <div className="relative aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-sm bg-ivory-200 border border-ivory-300 shadow-luxury group">
                        {categoryPreview || categoryDraft.image ? (
                          <Image
                            src={categoryPreview || categoryDraft.image}
                            alt={categoryDraft.imageAlt || categoryDraft.name}
                            fill
                            unoptimized
                            className="object-cover transition-all duration-300"
                            style={{ objectPosition: getObjectPositionStyle(categoryDraft.focalPoint) }}
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-gold-100 to-charcoal-200 font-serif text-3xl text-charcoal-700">
                            PH
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/20 to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 p-4 text-ivory-50 flex flex-col justify-end pointer-events-none">
                          <span className="text-[9px] uppercase tracking-widest text-gold-300 font-medium mb-1">
                            Curated Collection
                          </span>
                          <h4 className="font-serif text-lg font-bold text-white">
                            {categoryDraft.name}
                          </h4>
                          <span className="text-[10px] text-ivory-300/80 mt-1">
                            Focal: {categoryDraft.focalPoint}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-charcoal-500 mt-2 text-center max-w-[260px]">
                        Exact 3:4 aspect ratio rendering as patrons see on mobile, tablet, and desktop storefront.
                      </p>
                    </div>

                    {/* Edit Form Controls (Right) */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Category Name & Slug (Read-only from Catalogue) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                            Category Name (Catalogue Taxonomy)
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={categoryDraft.name}
                            className="w-full rounded border border-ivory-300 bg-ivory-100 px-3 py-2 text-sm text-charcoal-700 cursor-not-allowed font-medium"
                          />
                          <p className="text-[10px] text-charcoal-500 mt-1">
                            Names are linked to the catalog. Edit in Catalogue Taxonomy.
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                            Storefront Route
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={`/shop?category=${categoryDraft.slug}`}
                            className="w-full rounded border border-ivory-300 bg-ivory-100 px-3 py-2 text-sm text-charcoal-700 cursor-not-allowed font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Image Upload Area */}
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Category Photograph
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={categoryFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            className="hidden"
                            onChange={handleCategoryFileChange}
                          />
                          <button
                            type="button"
                            disabled={categoryUploading || categorySaving}
                            className="inline-flex items-center gap-2 rounded bg-charcoal-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-gold-600 transition-colors disabled:opacity-50"
                            onClick={() => categoryFileInputRef.current?.click()}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{categoryUploading ? "Uploading..." : "Upload New Image"}</span>
                          </button>
                          {categoryFileName && (
                            <span className="text-xs text-charcoal-600 font-medium">
                              {categoryFileName}
                            </span>
                          )}
                        </div>

                        {categoryUploading && (
                          <div className="mt-2 w-full bg-ivory-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gold-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${categoryUploadProgress}%` }}
                            />
                          </div>
                        )}
                        <p className="text-[11px] text-charcoal-500 mt-1">
                          Supports JPEG, PNG, WebP, and AVIF up to 10 MB. High-resolution vertical/portrait images recommended.
                        </p>
                      </div>

                      {/* Image URL Alternative */}
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Or Image URL (Alternative)
                        </label>
                        <input
                          type="text"
                          value={categoryDraft.image}
                          placeholder="/images/categories/category-sarees.jpg or https://..."
                          className={inputClass}
                          onChange={(e) => {
                            setCategoryDraft({ ...categoryDraft, image: e.target.value });
                            setCategoryPreview(e.target.value);
                          }}
                        />
                      </div>

                      {/* Image Alt Text */}
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Accessibility Alt Text
                        </label>
                        <input
                          type="text"
                          value={categoryDraft.imageAlt}
                          placeholder={`e.g. Master-crafted ${categoryDraft.name} collection`}
                          className={inputClass}
                          onChange={(e) => setCategoryDraft({ ...categoryDraft, imageAlt: e.target.value })}
                        />
                        <p className="text-[10px] text-charcoal-500 mt-1">
                          Describes the photograph for screen readers and search engines.
                        </p>
                      </div>

                      {/* Focal Point / Positioning Control */}
                      <div>
                        <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                          Image Focal Point &amp; Framing
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {[
                            { id: "center", label: "Center (Default)", desc: "50% 50%" },
                            { id: "top", label: "Top", desc: "Head & neckline" },
                            { id: "bottom", label: "Bottom", desc: "Hemline & borders" },
                            { id: "left", label: "Left", desc: "Left detail" },
                            { id: "right", label: "Right", desc: "Right detail" },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setCategoryDraft({ ...categoryDraft, focalPoint: opt.id })}
                              className={`p-2 rounded border text-left transition-all ${
                                (categoryDraft.focalPoint || "center").toLowerCase() === opt.id
                                  ? "border-gold-500 bg-gold-50 text-gold-900 font-semibold"
                                  : "border-ivory-300 bg-white text-charcoal-700 hover:border-gold-300"
                              }`}
                            >
                              <span className="text-xs block">{opt.label}</span>
                              <span className="text-[10px] text-charcoal-400 block">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-charcoal-500 mt-1.5">
                          Adjusts responsive crop framing to ensure key garment details, embroidery, or portrait features remain visible across viewports.
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-3 border-t border-ivory-300">
                        <button
                          type="submit"
                          disabled={categoryUploading || categorySaving}
                          className="inline-flex items-center gap-2 rounded bg-charcoal-900 px-5 py-2.5 text-xs font-semibold text-ivory-50 hover:bg-gold-600 transition-colors disabled:opacity-50"
                        >
                          {categorySaving ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving Changes...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={categoryUploading || categorySaving}
                          className="rounded border border-ivory-400 px-4 py-2.5 text-xs font-medium text-charcoal-700 hover:bg-ivory-100 transition-colors"
                          onClick={cancelEditCategory}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Category Cards Grid */}
            {categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((cat) => {
                  const isCustom = cat.image?.startsWith("/api/storage/");
                  const isExternal = cat.image?.startsWith("http");
                  const focal = cat.focalPoint || "center";

                  return (
                    <article
                      key={cat.id}
                      className={`${card} flex flex-col justify-between overflow-hidden p-0 border border-ivory-300 hover:border-gold-400 transition-all shadow-xs hover:shadow-md group`}
                    >
                      {/* Image Thumbnail with Overlay */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-ivory-200">
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.imageAlt || cat.name}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            style={{ objectPosition: getObjectPositionStyle(focal) }}
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-gold-100 to-charcoal-200 font-serif text-3xl text-charcoal-700">
                            PH
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/20 to-transparent pointer-events-none" />

                        {/* Status Badge */}
                        <div className="absolute top-2.5 left-2.5">
                          {isCustom ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-xs">
                              Custom Upload
                            </span>
                          ) : isExternal ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-500/30 backdrop-blur-xs">
                              External URL
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-charcoal-900/80 text-ivory-200 border border-ivory-300/30 backdrop-blur-xs">
                              Catalog Asset
                            </span>
                          )}
                        </div>

                        {/* Focal Badge */}
                        {focal !== "center" && (
                          <div className="absolute top-2.5 right-2.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-charcoal-900/80 text-gold-300 border border-gold-400/30 backdrop-blur-xs capitalize">
                              {focal}
                            </span>
                          </div>
                        )}

                        {/* Title Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-3 text-ivory-50 flex flex-col justify-end pointer-events-none">
                          <h4 className="font-serif text-base font-bold text-white leading-tight">
                            {cat.name}
                          </h4>
                          <span className="text-[10px] text-ivory-300 font-light truncate mt-0.5">
                            {cat.description || `/shop?category=${cat.slug}`}
                          </span>
                        </div>
                      </div>

                      {/* Card Bottom Controls */}
                      <div className="p-3 bg-white border-t border-ivory-200 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-gold-600 transition-colors"
                          onClick={() => startEditCategory(cat)}
                        >
                          <Edit3 className="w-3 h-3 text-gold-400" />
                          <span>Edit Image</span>
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded border border-ivory-300 bg-ivory-50 px-2.5 py-1.5 text-xs text-charcoal-700 hover:border-gold-500 hover:text-gold-700 transition-colors"
                          title="Preview category showcase card"
                          onClick={() => setPreviewingCategory(cat)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className={card + " text-sm text-charcoal-500"}>
                No categories found in the catalogue taxonomy.
              </p>
            )}

            {/* Category Preview Modal */}
            {previewingCategory && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/70 backdrop-blur-sm p-4 animate-fadeIn"
                onClick={() => setPreviewingCategory(null)}
              >
                <div
                  className="bg-white rounded-md border border-ivory-300 shadow-2xl max-w-sm w-full p-6 text-center space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-ivory-200 pb-3">
                    <h3 className="font-serif text-lg font-bold text-charcoal-900">
                      {previewingCategory.name} Preview
                    </h3>
                    <button
                      type="button"
                      className="text-xs text-charcoal-500 hover:text-charcoal-900"
                      onClick={() => setPreviewingCategory(null)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-ivory-200 border border-ivory-300 shadow-luxury mx-auto">
                    {previewingCategory.image ? (
                      <Image
                        src={previewingCategory.image}
                        alt={previewingCategory.imageAlt || previewingCategory.name}
                        fill
                        unoptimized
                        className="object-cover"
                        style={{ objectPosition: getObjectPositionStyle(previewingCategory.focalPoint || "center") }}
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-gold-100 to-charcoal-200 font-serif text-3xl text-charcoal-700">
                        PH
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-950/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-ivory-50 flex flex-col justify-end text-left pointer-events-none">
                      <span className="text-[10px] uppercase tracking-widest text-gold-300 font-medium mb-1">
                        Curated Collection
                      </span>
                      <h4 className="font-serif text-xl font-bold text-white">
                        {previewingCategory.name}
                      </h4>
                      {previewingCategory.description && (
                        <p className="text-[11px] text-ivory-300 font-light mt-1 line-clamp-2">
                          {previewingCategory.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-charcoal-500">
                      Focal Framing: <strong className="capitalize text-charcoal-900">{previewingCategory.focalPoint || "center"}</strong>
                    </span>
                    <button
                      type="button"
                      className="rounded bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 hover:bg-gold-600 transition-colors"
                      onClick={() => {
                        const target = previewingCategory;
                        setPreviewingCategory(null);
                        startEditCategory(target);
                      }}
                    >
                      Edit This Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section 4: Heritage Philosophy Section */}
          <section className="space-y-4 pt-4 border-t border-ivory-300">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-charcoal-900">
                  Heritage Philosophy Section
                </h2>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Manage the homepage artisan craft showcase, narrative memoir, brand values, and craft lineage badge.
                </p>
              </div>
              {!editingPhilosophy && (
                <button
                  type="button"
                  disabled={uploading || saving}
                  className="inline-flex items-center gap-2 rounded bg-charcoal-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-gold-600 transition-colors"
                  onClick={startEditPhilosophy}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Philosophy Section</span>
                </button>
              )}
            </div>

            {/* Editing Form for Philosophy Section */}
            {editingPhilosophy ? (
              <form onSubmit={submitPhilosophy} className="grid gap-5 rounded border border-gold-400 bg-ivory-50 p-6 sm:grid-cols-2 shadow-sm">
                <div className="sm:col-span-2 flex items-center justify-between border-b border-ivory-300 pb-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-charcoal-900">
                      Edit Heritage Philosophy Section
                    </h3>
                    <p className="text-xs text-charcoal-500">
                      Update the text, photography, pillars, and overlapping card displayed on the storefront.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={philosophyUploading || saving}
                    className={buttonClass}
                    onClick={cancelEditPhilosophy}
                  >
                    Cancel
                  </button>
                </div>

                {/* 1. Main Image Upload & Preview */}
                <div className="sm:col-span-2 space-y-3 rounded border border-ivory-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-charcoal-900">1. Main Artisan/Weaver Image *</span>
                      <p className="text-[11px] text-charcoal-500">
                        Upload photography of the traditional artisan/pit loom (JPEG, PNG, WebP, AVIF up to 10 MB).
                      </p>
                    </div>

                    <input
                      ref={philosophyFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={philosophyUploading}
                      className="hidden"
                      onChange={handlePhilosophyFileChange}
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={philosophyUploading}
                        onClick={() => philosophyFileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded bg-charcoal-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-gold-600 transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{philosophyPreview ? "Replace Image" : "Upload Image"}</span>
                      </button>

                      {philosophyPreview && (
                        <button
                          type="button"
                          disabled={philosophyUploading}
                          onClick={handleRemovePhilosophyImage}
                          className="inline-flex items-center gap-1.5 rounded border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Remove selected image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected file feedback & progress */}
                  {philosophyFileName && (
                    <div className="flex items-center gap-2 text-xs text-charcoal-700">
                      <span className="font-semibold">Selected file:</span>
                      <span className="font-mono text-[11px] bg-ivory-100 px-2 py-0.5 rounded border border-ivory-300">
                        {philosophyFileName}
                      </span>
                      {philosophyUploading && (
                        <span className="text-gold-700 font-semibold animate-pulse inline-flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Uploading ({philosophyUploadProgress}%)...
                        </span>
                      )}
                    </div>
                  )}

                  {/* Image Preview Box */}
                  {philosophyPreview ? (
                    <div className="relative aspect-[4/3] sm:aspect-[16/7] w-full max-w-xl mx-auto overflow-hidden rounded border border-ivory-300 bg-ivory-100 shadow-inner">
                      <Image
                        src={philosophyPreview}
                        alt="Philosophy preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute bottom-2 right-2 rounded bg-charcoal-900/80 px-2.5 py-1 text-[10px] font-medium text-ivory-100 backdrop-blur-xs flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>Main Image Preview</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-36 w-full flex-col items-center justify-center rounded border-2 border-dashed border-ivory-300 bg-ivory-50 text-charcoal-400">
                      <Upload className="w-6 h-6 mb-1 text-charcoal-300" />
                      <span className="text-xs font-medium">No image selected</span>
                      <span className="text-[10px] text-charcoal-400">Click &ldquo;Upload Image&rdquo; above or enter an Image URL below</span>
                    </div>
                  )}

                  {/* Alternative Direct Image URL */}
                  <label className="block text-[11px] font-semibold text-charcoal-600">
                    Or specify Image URL directly:
                    <input
                      className={`${inputClass} mt-1 font-mono text-xs`}
                      value={philosophyDraft.imageUrl}
                      placeholder="/images/... or /api/storage/products/... or https://..."
                      onChange={(e) => {
                        const url = e.target.value;
                        setPhilosophyDraft({ ...philosophyDraft, imageUrl: url });
                        setPhilosophyPreview(url);
                      }}
                    />
                  </label>
                </div>

                {/* 2. Image Alt Text */}
                <label className="space-y-1 text-xs font-semibold text-charcoal-900 sm:col-span-2">
                  2. Image Alt Text *
                  <input
                    required
                    maxLength={300}
                    className={inputClass}
                    value={philosophyDraft.imageAlt}
                    placeholder="e.g. Master artisan weaving traditional Indian handloom textile on wooden pit loom"
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, imageAlt: e.target.value })}
                  />
                </label>

                {/* 3. Eyebrow Text */}
                <label className="space-y-1 text-xs font-semibold text-charcoal-900">
                  3. Eyebrow Text *
                  <input
                    required
                    maxLength={100}
                    className={inputClass}
                    value={philosophyDraft.eyebrow}
                    placeholder="e.g. The Philosophy of Preheritage"
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, eyebrow: e.target.value })}
                  />
                </label>

                {/* 4. Main Heading */}
                <label className="space-y-1 text-xs font-semibold text-charcoal-900">
                  4. Main Heading (Supports line breaks) *
                  <textarea
                    rows={2}
                    required
                    maxLength={200}
                    className={inputClass}
                    value={philosophyDraft.heading}
                    placeholder={"Many Stories.\nOne Thread."}
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, heading: e.target.value })}
                  />
                  <span className="text-[10px] text-charcoal-400 block">
                    Separate lines with Enter. The last line will receive signature gold italic styling on the storefront.
                  </span>
                </label>

                {/* 5. First Paragraph */}
                <label className="space-y-1 text-xs font-semibold text-charcoal-900 sm:col-span-2">
                  5. First Paragraph *
                  <textarea
                    rows={3}
                    required
                    maxLength={1000}
                    className={inputClass}
                    value={philosophyDraft.paragraph1}
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, paragraph1: e.target.value })}
                  />
                </label>

                {/* 6. Second Paragraph */}
                <label className="space-y-1 text-xs font-semibold text-charcoal-900 sm:col-span-2">
                  6. Second Paragraph *
                  <textarea
                    rows={3}
                    required
                    maxLength={1000}
                    className={inputClass}
                    value={philosophyDraft.paragraph2}
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, paragraph2: e.target.value })}
                  />
                </label>

                {/* 7. Highlighted Quote */}
                <label className="space-y-1 text-xs font-semibold text-charcoal-900 sm:col-span-2">
                  7. Highlighted Quote *
                  <input
                    required
                    maxLength={200}
                    className={inputClass}
                    value={philosophyDraft.highlightQuote}
                    placeholder="e.g. Don’t Just Wear Heritage. Carry It Forward."
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, highlightQuote: e.target.value })}
                  />
                </label>

                {/* 8. Third Paragraph */}
                <label className="space-y-1 text-xs font-semibold text-charcoal-900 sm:col-span-2">
                  8. Third Paragraph *
                  <textarea
                    rows={3}
                    required
                    maxLength={1000}
                    className={inputClass}
                    value={philosophyDraft.paragraph3}
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, paragraph3: e.target.value })}
                  />
                </label>

                {/* 9. Three Value Blocks */}
                <div className="sm:col-span-2 space-y-3 rounded border border-ivory-200 bg-white p-4">
                  <span className="text-xs font-bold text-charcoal-900 block">
                    9. Three Brand Value Blocks (Pillars) *
                  </span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Value 1 */}
                    <div className="space-y-2 p-3 rounded bg-ivory-50 border border-ivory-200">
                      <span className="text-[11px] font-bold text-gold-700 uppercase tracking-wider block">Pillar 1</span>
                      <label className="block text-[11px] font-semibold text-charcoal-700">
                        Title
                        <input
                          required
                          maxLength={60}
                          className={`${inputClass} mt-0.5`}
                          value={philosophyDraft.value1Title}
                          placeholder="e.g. Indian Soul"
                          onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, value1Title: e.target.value })}
                        />
                      </label>
                      <label className="block text-[11px] font-semibold text-charcoal-700">
                        Subtitle
                        <input
                          required
                          maxLength={60}
                          className={`${inputClass} mt-0.5`}
                          value={philosophyDraft.value1Subtitle}
                          placeholder="e.g. Living Roots"
                          onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, value1Subtitle: e.target.value })}
                        />
                      </label>
                    </div>

                    {/* Value 2 */}
                    <div className="space-y-2 p-3 rounded bg-ivory-50 border border-ivory-200">
                      <span className="text-[11px] font-bold text-gold-700 uppercase tracking-wider block">Pillar 2</span>
                      <label className="block text-[11px] font-semibold text-charcoal-700">
                        Title
                        <input
                          required
                          maxLength={60}
                          className={`${inputClass} mt-0.5`}
                          value={philosophyDraft.value2Title}
                          placeholder="e.g. Global Luxury"
                          onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, value2Title: e.target.value })}
                        />
                      </label>
                      <label className="block text-[11px] font-semibold text-charcoal-700">
                        Subtitle
                        <input
                          required
                          maxLength={60}
                          className={`${inputClass} mt-0.5`}
                          value={philosophyDraft.value2Subtitle}
                          placeholder="e.g. Zero Compromise"
                          onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, value2Subtitle: e.target.value })}
                        />
                      </label>
                    </div>

                    {/* Value 3 */}
                    <div className="space-y-2 p-3 rounded bg-ivory-50 border border-ivory-200">
                      <span className="text-[11px] font-bold text-gold-700 uppercase tracking-wider block">Pillar 3</span>
                      <label className="block text-[11px] font-semibold text-charcoal-700">
                        Title
                        <input
                          required
                          maxLength={60}
                          className={`${inputClass} mt-0.5`}
                          value={philosophyDraft.value3Title}
                          placeholder="e.g. Timeless"
                          onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, value3Title: e.target.value })}
                        />
                      </label>
                      <label className="block text-[11px] font-semibold text-charcoal-700">
                        Subtitle
                        <input
                          required
                          maxLength={60}
                          className={`${inputClass} mt-0.5`}
                          value={philosophyDraft.value3Subtitle}
                          placeholder="e.g. Family Heirlooms"
                          onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, value3Subtitle: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 10 & 11. Overlapping Card Title & Quote */}
                <div className="sm:col-span-2 space-y-3 rounded border border-ivory-200 bg-white p-4">
                  <span className="text-xs font-bold text-charcoal-900 block">
                    10 &amp; 11. Overlapping Image Caption Card *
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs font-semibold text-charcoal-900">
                      Card Title *
                      <input
                        required
                        maxLength={80}
                        className={inputClass}
                        value={philosophyDraft.cardTitle}
                        placeholder="e.g. Sacred Craft Lineage"
                        onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, cardTitle: e.target.value })}
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold text-charcoal-900">
                      Card Quote *
                      <input
                        required
                        maxLength={250}
                        className={inputClass}
                        value={philosophyDraft.cardQuote}
                        placeholder="e.g. A single Varanasi Katan saree requires up to 180 days of patient hand-knotting."
                        onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, cardQuote: e.target.value })}
                      />
                    </label>
                  </div>
                </div>

                {/* 12. Memoir Link Text & URL */}
                <label className="space-y-1 text-xs font-semibold text-charcoal-900">
                  12a. Memoir Link Text *
                  <input
                    required
                    maxLength={100}
                    className={inputClass}
                    value={philosophyDraft.memoirLinkText}
                    placeholder="e.g. Read The Full Heritage Memoir"
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, memoirLinkText: e.target.value })}
                  />
                </label>

                <label className="space-y-1 text-xs font-semibold text-charcoal-900">
                  12b. Memoir Destination URL *
                  <input
                    required
                    maxLength={2048}
                    className={inputClass}
                    value={philosophyDraft.memoirLinkUrl}
                    placeholder="/about"
                    onChange={(e) => setPhilosophyDraft({ ...philosophyDraft, memoirLinkUrl: e.target.value })}
                  />
                </label>

                {/* 13. Save Changes and Cancel Buttons */}
                <div className="sm:col-span-2 pt-3 border-t border-ivory-200 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={saving || philosophyUploading}
                    className={buttonClass}
                    onClick={cancelEditPhilosophy}
                  >
                    Cancel
                  </button>

                  <button
                    disabled={saving || philosophyUploading}
                    className="rounded bg-charcoal-900 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-ivory-50 hover:bg-gold-600 transition-colors disabled:opacity-50 shadow-xs inline-flex items-center gap-2"
                  >
                    {philosophyUploading ? "Uploading Image..." : saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              /* View Card for Philosophy Section */
              <article className={`${card} transition-all hover:border-gold-400 space-y-4`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Image preview with overlapping card badge */}
                  <div className="md:col-span-4 relative">
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded bg-ivory-200 border border-ivory-300">
                      <Image
                        src={philosophy.imageUrl || DEFAULT_HERITAGE_PHILOSOPHY.imageUrl}
                        alt={philosophy.imageAlt || "Artisan weaving"}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    {/* Badge Preview */}
                    <div className="absolute -bottom-2 right-2 bg-charcoal-900 text-ivory-50 p-2.5 rounded-xs border border-gold-500/40 shadow-md max-w-[180px]">
                      <span className="text-[8px] tracking-wider uppercase text-gold-400 font-bold block">
                        {philosophy.cardTitle}
                      </span>
                      <p className="font-serif text-[11px] italic text-ivory-100 line-clamp-2 leading-tight">
                        &ldquo;{philosophy.cardQuote}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Narrative details */}
                  <div className="md:col-span-8 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gold-700 font-bold">
                        {philosophy.eyebrow}
                      </span>
                      <h3 className="font-serif text-2xl font-bold text-charcoal-900 whitespace-pre-line leading-tight">
                        {philosophy.heading}
                      </h3>
                    </div>

                    <div className="space-y-1.5 text-xs text-charcoal-600 line-clamp-2">
                      <p>{philosophy.paragraph1}</p>
                    </div>

                    <blockquote className="border-l-2 border-gold-500 pl-3 py-1 italic font-serif text-charcoal-900 text-sm bg-ivory-100">
                      &ldquo;{philosophy.highlightQuote}&rdquo;
                    </blockquote>

                    {/* Value blocks pill row */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-ivory-200 text-center">
                      <div className="bg-white p-1.5 rounded border border-ivory-200">
                        <span className="font-serif text-xs font-bold text-charcoal-900 block">{philosophy.value1Title}</span>
                        <span className="text-[9px] text-charcoal-500 uppercase tracking-wider block">{philosophy.value1Subtitle}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-ivory-200">
                        <span className="font-serif text-xs font-bold text-charcoal-900 block">{philosophy.value2Title}</span>
                        <span className="text-[9px] text-charcoal-500 uppercase tracking-wider block">{philosophy.value2Subtitle}</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-ivory-200">
                        <span className="font-serif text-xs font-bold text-charcoal-900 block">{philosophy.value3Title}</span>
                        <span className="text-[9px] text-charcoal-500 uppercase tracking-wider block">{philosophy.value3Subtitle}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <div className="inline-flex items-center gap-1.5 text-gold-700 font-semibold">
                        <span>{philosophy.memoirLinkText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span className="text-charcoal-400 font-normal">({philosophy.memoirLinkUrl})</span>
                      </div>

                      <button
                        type="button"
                        className={buttonClass}
                        onClick={startEditPhilosophy}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )}
          </section>
        </>
      )}
    </div>
  );
}
