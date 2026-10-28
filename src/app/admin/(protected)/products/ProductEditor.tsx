"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Star, Trash2 } from "lucide-react";

type ImageDraft = { url: string; altText: string; status: "uploaded" | "uploading" | "failed"; error?: string };
type VariantDraft = { id?: string; sku: string; size: string; color: string; colorCode: string; stock: number; additionalPrice: number };
type Option = { id: string; name: string; slug: string };
type Taxonomy = { categories: (Option & { subcategories: Option[] })[]; collections: Option[]; regions: (Option & { state: string; craftForm: string })[] };
type Draft = {
  title: string; sku: string; categoryId: string; subcategoryId: string; collectionId: string; regionId: string;
  price: number; mrp: number; costPrice: number | ""; stock: number; lowStockAlert: number;
  shortDesc: string; description: string; culturalStory: string; fabricDetails: string; careInstructions: string; sizeFitGuide: string;
  videoUrl: string; seoTitle: string; seoDescription: string; status: string;
  isFeatured: boolean; isNewArrival: boolean; isBestSeller: boolean; isSale: boolean; isLimitedEdition: boolean;
};
const emptyDraft: Draft = { title: "", sku: "", categoryId: "", subcategoryId: "", collectionId: "", regionId: "", price: 0, mrp: 0, costPrice: "", stock: 0, lowStockAlert: 3, shortDesc: "", description: "", culturalStory: "", fabricDetails: "", careInstructions: "", sizeFitGuide: "", videoUrl: "", seoTitle: "", seoDescription: "", status: "ACTIVE", isFeatured: false, isNewArrival: false, isBestSeller: false, isSale: false, isLimitedEdition: false };
const fieldClass = "w-full rounded border border-ivory-300 bg-white p-2.5 text-sm focus:border-gold-500 focus:outline-none";

export default function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [taxonomy, setTaxonomy] = useState<Taxonomy>({ categories: [], collections: [], regions: [] });
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const taxonomyResponse = await fetch("/api/admin/catalog-taxonomy", { cache: "no-store" });
        const taxonomyData = await taxonomyResponse.json();
        if (!taxonomyResponse.ok) throw new Error(taxonomyData.message || "Could not load catalogue choices.");
        if (!active) return;
        setTaxonomy(taxonomyData);
        if (productId) {
          const productResponse = await fetch(`/api/admin/products?id=${encodeURIComponent(productId)}`, { cache: "no-store" });
          const productData = await productResponse.json();
          if (!productResponse.ok) throw new Error(productData.message || "Could not load this product.");
          const product = productData.product;
          if (!active) return;
          setDraft({
            ...emptyDraft, ...product,
            subcategoryId: product.subcategoryId || "", collectionId: product.collectionId || "", regionId: product.regionId || "",
            costPrice: product.costPrice ?? "", videoUrl: product.videoUrl || "", seoTitle: product.seoTitle || "", seoDescription: product.seoDescription || "",
          });
          const loadedImages = product.images.map((image: { url: string; altText: string | null }) => ({ url: image.url, altText: image.altText || "", status: "uploaded" as const }));
          setImages(loadedImages);
          setPrimaryIndex(Math.max(0, product.images.findIndex((image: { isPrimary: boolean }) => image.isPrimary)));
          setVariants(product.variants.map((variant: VariantDraft) => ({ ...variant, colorCode: variant.colorCode || "" })));
        } else {
          setDraft((current) => ({ ...current, categoryId: taxonomyData.categories[0]?.id || "", regionId: taxonomyData.regions[0]?.id || "" }));
        }
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Could not load product form."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [productId]);

  const subcategories = useMemo(() => taxonomy.categories.find((category) => category.id === draft.categoryId)?.subcategories || [], [taxonomy.categories, draft.categoryId]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const uploadImages = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024)) { setError("Choose JPEG, PNG, or WebP images smaller than 10 MB each."); return; }
    setError(""); setUploading(true);
    const begin = images.length;
    setImages((current) => [...current, ...files.map(() => ({ url: "", altText: "", status: "uploading" as const }))]);
    try {
      const form = new FormData(); files.forEach((file) => form.append("files", file));
      const response = await fetch("/api/storage/upload", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Image upload failed.");
      setImages((current) => { const next = [...current]; result.uploads.forEach((item: { url: string }, index: number) => { next[begin + index] = { url: item.url, altText: "", status: "uploaded" }; }); return next; });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Image upload failed.";
      setImages((current) => current.map((image, index) => index >= begin && index < begin + files.length ? { ...image, status: "failed", error: message } : image));
      setError(message);
    } finally { setUploading(false); }
  };

  const moveImage = (index: number, delta: number) => setImages((current) => {
    const target = index + delta; if (target < 0 || target >= current.length) return current;
    const next = [...current]; [next[index], next[target]] = [next[target], next[index]];
    setPrimaryIndex((primary) => primary === index ? target : primary === target ? index : primary); return next;
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const readyImages = images.filter((image) => image.status === "uploaded");
      const readyPrimaryIndex = Math.max(0, images.slice(0, primaryIndex).filter((image) => image.status === "uploaded").length);
      const payload = { ...draft, productId, stock: variants.length ? 0 : draft.stock, costPrice: draft.costPrice === "" ? null : draft.costPrice, images: readyImages.map(({ url, altText }) => ({ url, altText })), primaryImageIndex: readyPrimaryIndex, variants };
      const response = await fetch("/api/admin/products", { method: productId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Product could not be saved.");
      router.push("/admin/products"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Product could not be saved."); }
    finally { setSaving(false); }
  };

  if (loading) return <p className="p-8 text-center text-sm text-charcoal-500">Loading product…</p>;
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex items-center gap-4"><Link href="/admin/products" className="rounded border border-ivory-300 bg-ivory-50 p-2"><ArrowLeft className="h-4 w-4" /></Link><div><h1 className="font-serif text-3xl font-bold text-charcoal-900">{productId ? "Edit product" : "Add product"}</h1><p className="mt-1 text-xs text-charcoal-500">Product, price, image, variant and storefront catalogue details</p></div></div>
    {error && <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    <form onSubmit={submit} className="space-y-5 text-xs">
      <section className="grid gap-4 rounded border border-ivory-300 bg-ivory-50 p-6 sm:grid-cols-2"><h2 className="sm:col-span-2 font-serif text-xl font-bold">Product details</h2>
        <label className="space-y-1 font-semibold sm:col-span-2">Title<input required minLength={3} maxLength={180} className={fieldClass} value={draft.title} onChange={(event) => set("title", event.target.value)} /></label>
        <label className="space-y-1 font-semibold">SKU<input required maxLength={50} className={fieldClass} value={draft.sku} onChange={(event) => set("sku", event.target.value.toUpperCase())} /></label>
        <label className="space-y-1 font-semibold">Category<select required className={fieldClass} value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value, subcategoryId: "" }))}><option value="">Choose category</option>{taxonomy.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="space-y-1 font-semibold">Subcategory<select className={fieldClass} value={draft.subcategoryId} onChange={(event) => set("subcategoryId", event.target.value)}><option value="">None</option>{subcategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="space-y-1 font-semibold">Collection<select className={fieldClass} value={draft.collectionId} onChange={(event) => set("collectionId", event.target.value)}><option value="">None</option>{taxonomy.collections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="space-y-1 font-semibold">Cultural region<select className={fieldClass} value={draft.regionId} onChange={(event) => set("regionId", event.target.value)}><option value="">None</option>{taxonomy.regions.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.craftForm}</option>)}</select></label>
        <label className="space-y-1 font-semibold">Short description<input maxLength={500} className={fieldClass} value={draft.shortDesc} onChange={(event) => set("shortDesc", event.target.value)} /></label>
        <label className="space-y-1 font-semibold sm:col-span-2">Description<textarea required minLength={10} maxLength={5000} rows={4} className={fieldClass} value={draft.description} onChange={(event) => set("description", event.target.value)} /></label>
        <label className="space-y-1 font-semibold sm:col-span-2">Cultural story<textarea maxLength={5000} rows={3} className={fieldClass} value={draft.culturalStory} onChange={(event) => set("culturalStory", event.target.value)} /></label>
        <label className="space-y-1 font-semibold">Fabric details<textarea maxLength={1000} rows={2} className={fieldClass} value={draft.fabricDetails} onChange={(event) => set("fabricDetails", event.target.value)} /></label>
        <label className="space-y-1 font-semibold">Care instructions<textarea maxLength={1000} rows={2} className={fieldClass} value={draft.careInstructions} onChange={(event) => set("careInstructions", event.target.value)} /></label>
        <label className="space-y-1 font-semibold">Size & fit guide<textarea maxLength={2000} rows={2} className={fieldClass} value={draft.sizeFitGuide} onChange={(event) => set("sizeFitGuide", event.target.value)} /></label>
      </section>

      <section className="grid gap-4 rounded border border-ivory-300 bg-ivory-50 p-6 sm:grid-cols-4"><h2 className="sm:col-span-4 font-serif text-xl font-bold">Price & stock</h2>
        <label className="space-y-1 font-semibold">Selling price<input required type="number" min="0.01" step="0.01" className={fieldClass} value={draft.price} onChange={(event) => set("price", Number(event.target.value))} /></label>
        <label className="space-y-1 font-semibold">MRP<input required type="number" min="0.01" step="0.01" className={fieldClass} value={draft.mrp} onChange={(event) => set("mrp", Number(event.target.value))} /></label>
        <label className="space-y-1 font-semibold">Cost price<input type="number" min="0" step="0.01" className={fieldClass} value={draft.costPrice} onChange={(event) => set("costPrice", event.target.value === "" ? "" : Number(event.target.value))} /></label>
        <label className="space-y-1 font-semibold">Low stock threshold<input required type="number" min="0" max="100000" className={fieldClass} value={draft.lowStockAlert} onChange={(event) => set("lowStockAlert", Number(event.target.value))} /></label>
        {!variants.length && <label className="space-y-1 font-semibold">Stock<input required type="number" min="0" max="100000" className={fieldClass} value={draft.stock} onChange={(event) => set("stock", Number(event.target.value))} /></label>}
        <label className="space-y-1 font-semibold">Status<select className={fieldClass} value={draft.status} onChange={(event) => set("status", event.target.value)}>{["ACTIVE", "DRAFT", "OUT_OF_STOCK", "ARCHIVED"].map((status) => <option key={status}>{status}</option>)}</select></label>
      </section>

      <section className="space-y-3 rounded border border-ivory-300 bg-ivory-50 p-6"><div className="flex items-center justify-between"><h2 className="font-serif text-xl font-bold">Variants</h2><button type="button" onClick={() => setVariants((current) => [...current, { sku: draft.sku ? `${draft.sku}-V${current.length + 1}`.slice(0, 50) : "", size: "", color: "", colorCode: "", stock: 0, additionalPrice: 0 }])} className="inline-flex items-center gap-1 rounded bg-charcoal-900 px-3 py-2 text-xs font-bold text-white"><Plus className="h-3 w-3" />Add variant</button></div>
        <p className="text-[11px] text-charcoal-500">Variant stock is authoritative when variants exist. Products without variants use the product stock field.</p>
        {variants.map((variant, index) => <div key={variant.id || index} className="grid gap-2 border-t border-ivory-200 pt-3 sm:grid-cols-6"><input aria-label="Variant SKU" required placeholder="SKU" className={fieldClass} value={variant.sku} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, sku: event.target.value.toUpperCase() } : item))} /><input aria-label="Variant size" required placeholder="Size" className={fieldClass} value={variant.size} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, size: event.target.value } : item))} /><input aria-label="Variant color" required placeholder="Color" className={fieldClass} value={variant.color} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, color: event.target.value } : item))} /><input aria-label="Variant color code" placeholder="#FFFFFF" className={fieldClass} value={variant.colorCode} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, colorCode: event.target.value } : item))} /><input aria-label="Variant stock" required type="number" min="0" max="100000" className={fieldClass} value={variant.stock} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, stock: Number(event.target.value) } : item))} /><div className="flex gap-1"><input aria-label="Additional price" type="number" min="0" step="0.01" className={fieldClass} value={variant.additionalPrice} onChange={(event) => setVariants((current) => current.map((item, i) => i === index ? { ...item, additionalPrice: Number(event.target.value) } : item))} /><button type="button" aria-label="Remove variant" onClick={() => setVariants((current) => current.filter((_, i) => i !== index))} className="rounded border border-rose-300 px-2 text-rose-800"><Trash2 className="h-4 w-4" /></button></div></div>)}
      </section>

      <section className="space-y-3 rounded border border-ivory-300 bg-ivory-50 p-6"><h2 className="font-serif text-xl font-bold">Product images</h2><p className="text-[11px] text-charcoal-500">JPEG, PNG or WebP, up to 10 MB each. Images use the existing authenticated object-storage upload.</p><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { void uploadImages(event.target.files); event.currentTarget.value = ""; }} />
        <div className="grid gap-3 sm:grid-cols-3">{images.map((image, index) => <div key={`${image.url}-${index}`} className="overflow-hidden rounded border border-ivory-300 bg-white"><div className="relative aspect-[3/4] bg-ivory-200">{image.url && image.status === "uploaded" && <Image src={image.url} alt={image.altText || `Product image ${index + 1}`} fill unoptimized className="object-cover" />}{image.status !== "uploaded" && <div className="absolute inset-0 grid place-items-center p-3 text-center text-xs">{image.error || "Uploading…"}</div>}{primaryIndex === index && image.status === "uploaded" && <span className="absolute left-2 top-2 bg-gold-600 px-2 py-1 text-[10px] font-bold text-white">Primary</span>}</div><input aria-label={`Image ${index + 1} alt text`} maxLength={240} placeholder="Image alt text" className="w-full border-y border-ivory-200 p-2 text-xs" value={image.altText} onChange={(event) => setImages((current) => current.map((item, i) => i === index ? { ...item, altText: event.target.value } : item))} /><div className="flex items-center justify-between p-2"><button type="button" title="Move image earlier" onClick={() => moveImage(index, -1)}><ChevronUp className="h-4 w-4" /></button><button type="button" onClick={() => setPrimaryIndex(index)} disabled={image.status !== "uploaded"} title="Set primary image"><Star className={`h-4 w-4 ${primaryIndex === index ? "fill-gold-500 text-gold-600" : ""}`} /></button><button type="button" title="Move image later" onClick={() => moveImage(index, 1)}><ChevronDown className="h-4 w-4" /></button><button type="button" title="Remove image" onClick={() => { setImages((current) => current.filter((_, i) => i !== index)); setPrimaryIndex((current) => Math.max(0, current > index ? current - 1 : current)); }}><Trash2 className="h-4 w-4 text-rose-700" /></button></div></div>)}</div>
      </section>

      <section className="grid gap-3 rounded border border-ivory-300 bg-ivory-50 p-6 sm:grid-cols-2"><h2 className="sm:col-span-2 font-serif text-xl font-bold">Storefront flags & SEO</h2>{([["isFeatured", "Featured"], ["isNewArrival", "New arrival"], ["isBestSeller", "Bestseller"], ["isSale", "Sale"], ["isLimitedEdition", "Limited edition"]] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={draft[key]} onChange={(event) => set(key, event.target.checked)} />{label}</label>)}<label className="space-y-1 font-semibold">Video URL<input className={fieldClass} value={draft.videoUrl} onChange={(event) => set("videoUrl", event.target.value)} /></label><label className="space-y-1 font-semibold">SEO title<input maxLength={180} className={fieldClass} value={draft.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} /></label><label className="space-y-1 font-semibold sm:col-span-2">SEO description<textarea maxLength={1000} className={fieldClass} value={draft.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} /></label></section>

      <div className="flex justify-end"><button disabled={saving || uploading} className="rounded bg-charcoal-900 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">{saving ? "Saving…" : uploading ? "Wait for uploads…" : productId ? "Save product changes" : "Create product"}</button></div>
    </form>
  </div>;
}
