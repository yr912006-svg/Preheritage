import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { adminAuditStore } from "@/lib/admin-audit";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { normalizeTaxonomyInput, TAXONOMY_KINDS, type TaxonomyKind } from "@/lib/catalog-taxonomy";

async function getTaxonomy(_request: Request) {
  try {
    const [categories, collections, regions] = await Promise.all([
      prisma.category.findMany({ orderBy: [{ orderIndex: "asc" }, { name: "asc" }], include: { subcategories: { orderBy: { name: "asc" } } } }),
      prisma.collection.findMany({ orderBy: { name: "asc" } }),
      prisma.region.findMany({ orderBy: { name: "asc" } }),
    ]);
    return NextResponse.json({ categories, collections, regions });
  } catch (error) {
    console.error("Admin catalogue taxonomy lookup failed:", error);
    return NextResponse.json({ message: "Could not load catalogue categories and collections." }, { status: 503 });
  }
}

async function createTaxonomy(request: Request) {
  try {
    const body = await request.json();
    const kind = parseKind(body?.kind);
    if (!kind) return NextResponse.json({ message: "Choose a valid catalogue type." }, { status: 400 });
    const normalized = normalizeTaxonomyInput(body, kind);
    if (normalized.ok === false) return NextResponse.json({ message: normalized.message }, { status: 400 });
    if (kind === "subcategory") {
      if (!("categoryId" in normalized.data)) return NextResponse.json({ message: "Choose a parent category." }, { status: 400 });
      if (!await prisma.category.findUnique({ where: { id: normalized.data.categoryId }, select: { id: true } })) {
        return NextResponse.json({ message: "The parent category was not found." }, { status: 404 });
      }
    }
    const record = await createRecord(kind, normalized.data as never);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ message: "That name or slug is already in use." }, { status: 409 });
    console.error("Admin catalogue taxonomy create failed:", error);
    return NextResponse.json({ message: "Could not create this catalogue entry." }, { status: 503 });
  }
}

async function updateTaxonomy(request: Request) {
  try {
    const body = await request.json();
    const kind = parseKind(body?.kind);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!kind || !id) return NextResponse.json({ message: "Choose a catalogue type and entry." }, { status: 400 });
    const normalized = normalizeTaxonomyInput(body, kind);
    if (normalized.ok === false) return NextResponse.json({ message: normalized.message }, { status: 400 });
    if (kind === "subcategory") {
      if (!("categoryId" in normalized.data)) return NextResponse.json({ message: "Choose a parent category." }, { status: 400 });
      if (!await prisma.category.findUnique({ where: { id: normalized.data.categoryId }, select: { id: true } })) {
        return NextResponse.json({ message: "The parent category was not found." }, { status: 404 });
      }
    }
    const record = await updateRecord(kind, id, normalized.data as never);
    return record ? NextResponse.json({ record }) : NextResponse.json({ message: "Catalogue entry not found." }, { status: 404 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ message: "That name or slug is already in use." }, { status: 409 });
    console.error("Admin catalogue taxonomy update failed:", error);
    return NextResponse.json({ message: "Could not update this catalogue entry." }, { status: 503 });
  }
}

async function deleteTaxonomy(request: Request) {
  try {
    const body = await request.json();
    const kind = parseKind(body?.kind);
    const id = typeof body?.id === "string" ? body.id : "";
    if (!kind || !id) return NextResponse.json({ message: "Choose a catalogue type and entry." }, { status: 400 });
    const busy = await hasProductReferences(kind, id);
    if (busy === null) return NextResponse.json({ message: "Catalogue entry not found." }, { status: 404 });
    if (busy) return NextResponse.json({ message: "This entry is assigned to products. Reassign those products before deleting it." }, { status: 409 });
    await deleteRecord(kind, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin catalogue taxonomy delete failed:", error);
    return NextResponse.json({ message: "Could not delete this catalogue entry." }, { status: 503 });
  }
}

function parseKind(value: unknown): TaxonomyKind | null {
  return typeof value === "string" && (TAXONOMY_KINDS as readonly string[]).includes(value) ? value as TaxonomyKind : null;
}

function createRecord(kind: TaxonomyKind, data: never) {
  switch (kind) {
    case "category": return prisma.category.create({ data: data as Parameters<typeof prisma.category.create>[0]["data"] });
    case "subcategory": return prisma.subcategory.create({ data: data as Parameters<typeof prisma.subcategory.create>[0]["data"] });
    case "collection": return prisma.collection.create({ data: data as Parameters<typeof prisma.collection.create>[0]["data"] });
    case "region": return prisma.region.create({ data: data as Parameters<typeof prisma.region.create>[0]["data"] });
  }
}

function updateRecord(kind: TaxonomyKind, id: string, data: never) {
  switch (kind) {
    case "category": return prisma.category.update({ where: { id }, data: data as Parameters<typeof prisma.category.update>[0]["data"] }).catch(skipMissing);
    case "subcategory": return prisma.subcategory.update({ where: { id }, data: data as Parameters<typeof prisma.subcategory.update>[0]["data"] }).catch(skipMissing);
    case "collection": return prisma.collection.update({ where: { id }, data: data as Parameters<typeof prisma.collection.update>[0]["data"] }).catch(skipMissing);
    case "region": return prisma.region.update({ where: { id }, data: data as Parameters<typeof prisma.region.update>[0]["data"] }).catch(skipMissing);
  }
}

function skipMissing(error: any): null {
  if (error?.code === "P2025") return null;
  throw error;
}

async function hasProductReferences(kind: TaxonomyKind, id: string): Promise<boolean | null> {
  if (kind === "category") {
    const entry = await prisma.category.findUnique({ where: { id }, select: { products: { take: 1, select: { id: true } }, subcategories: { select: { products: { take: 1, select: { id: true } } } } } });
    return entry ? entry.products.length > 0 || entry.subcategories.some((child) => child.products.length > 0) : null;
  }
  if (kind === "subcategory") {
    const entry = await prisma.subcategory.findUnique({ where: { id }, select: { products: { take: 1, select: { id: true } } } });
    return entry ? entry.products.length > 0 : null;
  }
  if (kind === "collection") {
    const entry = await prisma.collection.findUnique({ where: { id }, select: { products: { take: 1, select: { id: true } } } });
    return entry ? entry.products.length > 0 : null;
  }
  const entry = await prisma.region.findUnique({ where: { id }, select: { products: { take: 1, select: { id: true } } } });
  return entry ? entry.products.length > 0 : null;
}

function deleteRecord(kind: TaxonomyKind, id: string) {
  switch (kind) {
    case "category": return prisma.category.delete({ where: { id } });
    case "subcategory": return prisma.subcategory.delete({ where: { id } });
    case "collection": return prisma.collection.delete({ where: { id } });
    case "region": return prisma.region.delete({ where: { id } });
  }
}

function createAdminTaxonomyHandlers(authorize = requireAdminCapability) {
  return {
    GET: withAdminCapability(ADMIN_API_CAPABILITIES.catalogTaxonomy.methods.GET, getTaxonomy, authorize),
    POST: withAdminCapability(ADMIN_API_CAPABILITIES.catalogTaxonomy.methods.POST, createTaxonomy, authorize, adminAuditStore),
    PATCH: withAdminCapability(ADMIN_API_CAPABILITIES.catalogTaxonomy.methods.PATCH, updateTaxonomy, authorize, adminAuditStore),
    DELETE: withAdminCapability(ADMIN_API_CAPABILITIES.catalogTaxonomy.methods.DELETE, deleteTaxonomy, authorize, adminAuditStore),
  };
}

const handlers = createAdminTaxonomyHandlers();
export const { GET, POST, PATCH, DELETE } = handlers;
