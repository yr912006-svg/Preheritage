"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

type Entry = Record<string, any>;
type Taxonomy = { categories: Entry[]; collections: Entry[]; regions: Entry[] };
type Kind = "category" | "subcategory" | "collection" | "region";
const blank = (): Entry => ({ kind: "category", name: "", slug: "", description: "", image: "", featured: false, orderIndex: 0, categoryId: "", tagline: "", bannerImage: "", state: "", craftForm: "", culturalStory: "" });
const inputClass = "w-full rounded border border-ivory-300 bg-white p-2.5 text-sm focus:border-gold-500 focus:outline-none";

export default function CatalogTaxonomyClient() {
  const [data, setData] = useState<Taxonomy>({ categories: [], collections: [], regions: [] });
  const [form, setForm] = useState<Entry>(blank());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/catalog-taxonomy", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Could not load catalogue settings.");
    setData(result);
  }, []);
  useEffect(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load catalogue settings.")); }, [load]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/catalog-taxonomy", { method: form.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save catalogue entry.");
      setForm(blank()); await load(); setNotice("Catalogue entry saved and storefront filters updated.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save catalogue entry."); }
    finally { setBusy(false); }
  };

  const remove = async (kind: Kind, item: Entry) => {
    if (!confirm(`Delete “${item.name}”? Entries assigned to products cannot be deleted.`)) return;
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/catalog-taxonomy", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id: item.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not delete catalogue entry.");
      await load(); setNotice("Catalogue entry deleted.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete catalogue entry."); }
  };

  const edit = (kind: Kind, item: Entry) => setForm({ ...blank(), ...item, kind, categoryId: kind === "subcategory" ? item.categoryId : "" });
  const categories = data.categories.flatMap((category) => [
    { kind: "category" as const, item: category },
    ...(category.subcategories || []).map((item: Entry) => ({ kind: "subcategory" as const, item })),
  ]);
  const entries: { title: string; kind: Kind; items: Entry[] }[] = [
    { title: "Categories & subcategories", kind: "category", items: categories.map((entry) => ({ ...entry.item, _kind: entry.kind })) },
    { title: "Collections", kind: "collection", items: data.collections },
    { title: "Cultural regions", kind: "region", items: data.regions },
  ];

  return <div className="mx-auto max-w-6xl space-y-6">
    <header><h1 className="font-serif text-3xl font-bold text-charcoal-900">Catalogue Categories & Collections</h1><p className="mt-1 text-sm text-charcoal-500">Manage the categories, collections and regions used by product forms and storefront filters.</p></header>
    {error && <p role="alert" className="rounded border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {notice && <p role="status" className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

    <form onSubmit={save} className="grid gap-4 rounded border border-ivory-300 bg-ivory-50 p-5 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-center justify-between"><h2 className="font-serif text-xl font-bold">{form.id ? "Edit catalogue entry" : "Add catalogue entry"}</h2>{form.id && <button type="button" onClick={() => setForm(blank())} className="inline-flex items-center gap-1 text-xs underline"><RotateCcw className="h-3 w-3" />Cancel edit</button>}</div>
      <label className="space-y-1 text-xs font-semibold">Type<select className={inputClass} value={form.kind} onChange={(event) => setForm({ ...blank(), kind: event.target.value })} disabled={Boolean(form.id)}><option value="category">Category</option><option value="subcategory">Subcategory</option><option value="collection">Collection</option><option value="region">Cultural region</option></select></label>
      {form.kind === "subcategory" && <label className="space-y-1 text-xs font-semibold">Parent category<select className={inputClass} required value={form.categoryId || ""} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Choose category</option>{data.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      <label className="space-y-1 text-xs font-semibold">Name<input className={inputClass} required minLength={2} maxLength={120} value={form.name || ""} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label className="space-y-1 text-xs font-semibold">Slug<input className={inputClass} maxLength={120} value={form.slug || ""} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Generated from the name when empty" /></label>
      {(form.kind === "category" || form.kind === "subcategory") && <label className="space-y-1 text-xs font-semibold">Card image URL<input className={inputClass} value={form.image || ""} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://… or uploaded product image URL" /></label>}
      {(form.kind === "collection" || form.kind === "region") && <label className="space-y-1 text-xs font-semibold">Banner image URL<input className={inputClass} value={form.bannerImage || ""} onChange={(event) => setForm({ ...form, bannerImage: event.target.value })} placeholder="https://… or uploaded product image URL" /></label>}
      {form.kind === "collection" && <label className="space-y-1 text-xs font-semibold">Tagline<input className={inputClass} maxLength={240} value={form.tagline || ""} onChange={(event) => setForm({ ...form, tagline: event.target.value })} /></label>}
      {(form.kind === "category" || form.kind === "subcategory" || form.kind === "collection") && <label className="space-y-1 text-xs font-semibold sm:col-span-2">Description<textarea className={inputClass} rows={2} maxLength={2000} value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>}
      {form.kind === "region" && <><label className="space-y-1 text-xs font-semibold">State<input className={inputClass} required maxLength={120} value={form.state || ""} onChange={(event) => setForm({ ...form, state: event.target.value })} /></label><label className="space-y-1 text-xs font-semibold">Craft form<input className={inputClass} required maxLength={240} value={form.craftForm || ""} onChange={(event) => setForm({ ...form, craftForm: event.target.value })} /></label><label className="space-y-1 text-xs font-semibold sm:col-span-2">Cultural story<textarea className={inputClass} rows={3} required minLength={10} maxLength={5000} value={form.culturalStory || ""} onChange={(event) => setForm({ ...form, culturalStory: event.target.value })} /></label></>}
      {form.kind === "category" && <label className="space-y-1 text-xs font-semibold">Display order<input className={inputClass} type="number" min="0" max="100000" value={form.orderIndex ?? 0} onChange={(event) => setForm({ ...form, orderIndex: Number(event.target.value) })} /></label>}
      {form.kind !== "subcategory" && <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold"><input type="checkbox" checked={form.featured === true} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />Featured</label>}
      <div className="sm:col-span-2"><button disabled={busy} className="inline-flex items-center gap-2 rounded bg-charcoal-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"><Plus className="h-4 w-4" />{busy ? "Saving…" : form.id ? "Save changes" : "Add entry"}</button></div>
    </form>

    {entries.map((group) => <section key={group.title} className="overflow-hidden rounded border border-ivory-300 bg-ivory-50"><h2 className="border-b border-ivory-300 px-5 py-3 font-serif text-xl font-bold">{group.title}</h2><div className="divide-y divide-ivory-200">{group.items.map((item) => { const kind = item._kind || group.kind; return <div key={`${kind}-${item.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><div className="font-semibold text-charcoal-900">{item.name} <span className="ml-2 text-[10px] uppercase tracking-wider text-gold-700">{kind}</span></div><div className="text-xs text-charcoal-500">/{item.slug}{item.state ? ` · ${item.state}` : ""}</div></div><div className="flex gap-2"><button onClick={() => edit(kind, item)} className="inline-flex items-center gap-1 rounded border border-ivory-400 px-3 py-2 text-xs"><Pencil className="h-3 w-3" />Edit</button><button onClick={() => void remove(kind, item)} className="inline-flex items-center gap-1 rounded border border-rose-300 px-3 py-2 text-xs text-rose-800"><Trash2 className="h-3 w-3" />Delete</button></div></div>; })}{!group.items.length && <p className="px-5 py-8 text-center text-sm text-charcoal-500">No entries yet.</p>}</div></section>)}
  </div>;
}
