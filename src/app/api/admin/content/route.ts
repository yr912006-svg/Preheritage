import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { adminAuditStore } from "@/lib/admin-audit";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { getHeritagePhilosophy, saveHeritagePhilosophy } from "@/lib/heritage-philosophy";

type Body = Record<string, unknown>;
const isBody = (value: unknown): value is Body => typeof value === "object" && value !== null && !Array.isArray(value);
const onlyKeys = (body: Body, allowed: readonly string[]) => Object.keys(body).every((key) => allowed.includes(key));
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
function imageUrl(value: unknown): value is string {
  if (!text(value, 2048)) return false;
  return (
    value.startsWith("/api/storage/products/") ||
    value.startsWith("/images/") ||
    (() => {
      try {
        return new URL(value).protocol === "https:";
      } catch {
        return false;
      }
    })()
  );
}
function destination(value: unknown): value is string | null | undefined {
  if (value === null || value === "") return true;
  if (!text(value, 2048)) return false;
  if (value.startsWith("/")) return !value.startsWith("//") && !value.startsWith("/\\");
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

async function getContent() {
  try {
    const [banners, posters, philosophy, categories] = await Promise.all([
      prisma.banner.findMany({ orderBy: [{ priority: "asc" }, { createdAt: "desc" }] }),
      prisma.poster.findMany({ orderBy: [{ orderIndex: "asc" }, { createdAt: "desc" }] }),
      getHeritagePhilosophy(),
      prisma.category.findMany({
        orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          imageAlt: true,
          focalPoint: true,
          orderIndex: true,
        },
      }),
    ]);
    return NextResponse.json({ banners, posters, philosophy, categories });
  } catch (error) {
    console.error("Admin content lookup failed:", error);
    return NextResponse.json({ message: "Could not load content." }, { status: 503 });
  }
}

async function createContent(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isBody(body)) return NextResponse.json({ message: "Provide content details." }, { status: 400 });
    if (body.type === "philosophy") {
      if (!imageUrl(body.imageUrl)) {
        return NextResponse.json({ message: "Please provide a valid image URL for the philosophy section." }, { status: 400 });
      }
      const saved = await saveHeritagePhilosophy({
        imageUrl: String(body.imageUrl),
        imageAlt: typeof body.imageAlt === "string" ? body.imageAlt : undefined,
        eyebrow: typeof body.eyebrow === "string" ? body.eyebrow : undefined,
        heading: typeof body.heading === "string" ? body.heading : undefined,
        paragraph1: typeof body.paragraph1 === "string" ? body.paragraph1 : undefined,
        paragraph2: typeof body.paragraph2 === "string" ? body.paragraph2 : undefined,
        highlightQuote: typeof body.highlightQuote === "string" ? body.highlightQuote : undefined,
        paragraph3: typeof body.paragraph3 === "string" ? body.paragraph3 : undefined,
        value1Title: typeof body.value1Title === "string" ? body.value1Title : undefined,
        value1Subtitle: typeof body.value1Subtitle === "string" ? body.value1Subtitle : undefined,
        value2Title: typeof body.value2Title === "string" ? body.value2Title : undefined,
        value2Subtitle: typeof body.value2Subtitle === "string" ? body.value2Subtitle : undefined,
        value3Title: typeof body.value3Title === "string" ? body.value3Title : undefined,
        value3Subtitle: typeof body.value3Subtitle === "string" ? body.value3Subtitle : undefined,
        cardTitle: typeof body.cardTitle === "string" ? body.cardTitle : undefined,
        cardQuote: typeof body.cardQuote === "string" ? body.cardQuote : undefined,
        memoirLinkText: typeof body.memoirLinkText === "string" ? body.memoirLinkText : undefined,
        memoirLinkUrl: typeof body.memoirLinkUrl === "string" ? body.memoirLinkUrl : undefined,
      });
      return NextResponse.json({ record: saved }, { status: 201 });
    }
    if (body.type === "banner") {
      if (!onlyKeys(body, ["type", "title", "imageUrl", "subtitle", "tagline", "link", "priority", "isActive", "position"])) return NextResponse.json({ message: "The banner contains unsupported fields." }, { status: 400 });
      if (!text(body.title, 180) || !imageUrl(body.imageUrl) || !(body.subtitle === null || body.subtitle === undefined || typeof body.subtitle === "string" && body.subtitle.length <= 500) || !(body.tagline === null || body.tagline === undefined || typeof body.tagline === "string" && body.tagline.length <= 120) || !destination(body.link) || typeof body.priority !== "number" || !Number.isSafeInteger(body.priority) || body.priority < 0 || body.priority > 100000 || typeof body.isActive !== "boolean") {
        return NextResponse.json({ message: "Check the banner title, image, text, destination, and display order." }, { status: 400 });
      }
      const position = typeof body.position === "string" && ["LEFT", "CENTER", "RIGHT"].includes(body.position.toUpperCase()) ? body.position.toUpperCase() : "CENTER";
      const banner = await prisma.banner.create({ data: { title: body.title.trim(), subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() || null : null, imageUrl: body.imageUrl, tagline: typeof body.tagline === "string" ? body.tagline.trim() || null : null, link: typeof body.link === "string" ? body.link.trim() || null : null, priority: body.priority, position, isActive: body.isActive === true } });
      try { revalidatePath("/"); } catch {}
      return NextResponse.json({ record: banner }, { status: 201 });
    }
    if (body.type === "poster") {
      if (!onlyKeys(body, ["type", "title", "theme", "imageUrl", "description", "isPublished"])) return NextResponse.json({ message: "The poster contains unsupported fields." }, { status: 400 });
      if (!text(body.title, 180) || !text(body.theme, 120) || !imageUrl(body.imageUrl) || !(body.description === null || body.description === undefined || typeof body.description === "string" && body.description.length <= 2000) || typeof body.isPublished !== "boolean") {
        return NextResponse.json({ message: "Check the poster title, theme, image, description, and publishing status." }, { status: 400 });
      }
      const poster = await prisma.poster.create({ data: { title: body.title.trim(), theme: body.theme.trim(), imageUrl: body.imageUrl, description: typeof body.description === "string" ? body.description.trim() || null : null, isPublished: body.isPublished, orderIndex: 0 } });
      return NextResponse.json({ record: poster }, { status: 201 });
    }
    if (body.type === "category") {
      if (!onlyKeys(body, ["type", "id", "image", "imageAlt", "focalPoint"])) {
        return NextResponse.json({ message: "The category contains unsupported fields." }, { status: 400 });
      }
      if (typeof body.id !== "string" || !body.id.trim()) {
        return NextResponse.json({ message: "Choose a category to update." }, { status: 400 });
      }
      if (!imageUrl(body.image)) {
        return NextResponse.json({ message: "Please provide a valid image URL for the category." }, { status: 400 });
      }
      const imageAlt = typeof body.imageAlt === "string" ? body.imageAlt.trim().slice(0, 300) : null;
      const focalPoint = typeof body.focalPoint === "string" ? body.focalPoint.trim().slice(0, 50) : null;

      const record = await prisma.category.update({
        where: { id: body.id },
        data: {
          image: body.image.trim(),
          imageAlt,
          focalPoint,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          imageAlt: true,
          focalPoint: true,
          orderIndex: true,
        },
      });

      try {
        revalidatePath("/");
        revalidatePath("/shop");
        revalidatePath("/admin/content");
      } catch {}

      return NextResponse.json({ record });
    }
    return NextResponse.json({ message: "Choose banner, poster, category, or philosophy content." }, { status: 400 });
  } catch (error) {
    console.error("Admin content creation failed:", error);
    return NextResponse.json({ message: "Could not create this content record." }, { status: 503 });
  }
}

async function updateContent(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isBody(body)) return NextResponse.json({ message: "Choose a content record to update." }, { status: 400 });
    if (body.type === "philosophy") {
      if (!imageUrl(body.imageUrl)) {
        return NextResponse.json({ message: "Please provide a valid image URL for the philosophy section." }, { status: 400 });
      }
      const saved = await saveHeritagePhilosophy({
        imageUrl: String(body.imageUrl),
        imageAlt: typeof body.imageAlt === "string" ? body.imageAlt : undefined,
        eyebrow: typeof body.eyebrow === "string" ? body.eyebrow : undefined,
        heading: typeof body.heading === "string" ? body.heading : undefined,
        paragraph1: typeof body.paragraph1 === "string" ? body.paragraph1 : undefined,
        paragraph2: typeof body.paragraph2 === "string" ? body.paragraph2 : undefined,
        highlightQuote: typeof body.highlightQuote === "string" ? body.highlightQuote : undefined,
        paragraph3: typeof body.paragraph3 === "string" ? body.paragraph3 : undefined,
        value1Title: typeof body.value1Title === "string" ? body.value1Title : undefined,
        value1Subtitle: typeof body.value1Subtitle === "string" ? body.value1Subtitle : undefined,
        value2Title: typeof body.value2Title === "string" ? body.value2Title : undefined,
        value2Subtitle: typeof body.value2Subtitle === "string" ? body.value2Subtitle : undefined,
        value3Title: typeof body.value3Title === "string" ? body.value3Title : undefined,
        value3Subtitle: typeof body.value3Subtitle === "string" ? body.value3Subtitle : undefined,
        cardTitle: typeof body.cardTitle === "string" ? body.cardTitle : undefined,
        cardQuote: typeof body.cardQuote === "string" ? body.cardQuote : undefined,
        memoirLinkText: typeof body.memoirLinkText === "string" ? body.memoirLinkText : undefined,
        memoirLinkUrl: typeof body.memoirLinkUrl === "string" ? body.memoirLinkUrl : undefined,
      });
      return NextResponse.json({ record: saved });
    }
    if (typeof body.id !== "string" || !body.id.trim()) return NextResponse.json({ message: "Choose a content record to update." }, { status: 400 });
    if (body.type === "banner") {
      if (!onlyKeys(body, ["type", "id", "isActive", "title", "imageUrl", "subtitle", "tagline", "link", "priority", "position"])) return NextResponse.json({ message: "The banner contains unsupported fields." }, { status: 400 });
      if (typeof body.isActive === "boolean" && Object.keys(body).length === 3) {
        const record = await prisma.banner.update({ where: { id: body.id }, data: { isActive: body.isActive } });
        try { revalidatePath("/"); } catch {}
        return NextResponse.json({ record });
      }
      if (!text(body.title, 180) || !imageUrl(body.imageUrl) || !(body.subtitle === null || typeof body.subtitle === "string" && body.subtitle.length <= 500) || !(body.tagline === null || typeof body.tagline === "string" && body.tagline.length <= 120) || !destination(body.link) || typeof body.priority !== "number" || !Number.isSafeInteger(body.priority) || body.priority < 0 || body.priority > 100000 || typeof body.isActive !== "boolean") return NextResponse.json({ message: "Check the banner fields." }, { status: 400 });
      const position = typeof body.position === "string" && ["LEFT", "CENTER", "RIGHT"].includes(body.position.toUpperCase()) ? body.position.toUpperCase() : undefined;
      const record = await prisma.banner.update({
        where: { id: body.id },
        data: {
          title: body.title.trim(),
          subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() || null : null,
          imageUrl: body.imageUrl,
          tagline: typeof body.tagline === "string" ? body.tagline.trim() || null : null,
          link: typeof body.link === "string" ? body.link.trim() || null : null,
          priority: body.priority,
          isActive: body.isActive,
          ...(position ? { position } : {}),
        },
      });
      try { revalidatePath("/"); } catch {}
      return NextResponse.json({ record });
    }
    if (body.type === "poster") {
      if (!onlyKeys(body, ["type", "id", "isPublished", "title", "theme", "imageUrl", "description"])) return NextResponse.json({ message: "The poster contains unsupported fields." }, { status: 400 });
      if (typeof body.isPublished === "boolean" && Object.keys(body).length === 3) {
        const record = await prisma.poster.update({ where: { id: body.id }, data: { isPublished: body.isPublished } });
        return NextResponse.json({ record });
      }
      if (!text(body.title, 180) || !text(body.theme, 120) || !imageUrl(body.imageUrl) || !(body.description === null || typeof body.description === "string" && body.description.length <= 2000) || typeof body.isPublished !== "boolean") return NextResponse.json({ message: "Check the poster fields." }, { status: 400 });
      const record = await prisma.poster.update({ where: { id: body.id }, data: { title: body.title.trim(), theme: body.theme.trim(), imageUrl: body.imageUrl, description: typeof body.description === "string" ? body.description.trim() || null : null, isPublished: body.isPublished } });
      return NextResponse.json({ record });
    }
    if (body.type === "category") {
      if (!onlyKeys(body, ["type", "id", "image", "imageAlt", "focalPoint"])) {
        return NextResponse.json({ message: "The category contains unsupported fields." }, { status: 400 });
      }
      if (typeof body.id !== "string" || !body.id.trim()) {
        return NextResponse.json({ message: "Choose a category to update." }, { status: 400 });
      }
      if (!imageUrl(body.image)) {
        return NextResponse.json({ message: "Please provide a valid image URL for the category." }, { status: 400 });
      }
      const imageAlt = typeof body.imageAlt === "string" ? body.imageAlt.trim().slice(0, 300) : null;
      const focalPoint = typeof body.focalPoint === "string" ? body.focalPoint.trim().slice(0, 50) : null;

      const record = await prisma.category.update({
        where: { id: body.id },
        data: {
          image: body.image.trim(),
          imageAlt,
          focalPoint,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          imageAlt: true,
          focalPoint: true,
          orderIndex: true,
        },
      });

      try {
        revalidatePath("/");
        revalidatePath("/shop");
        revalidatePath("/admin/content");
      } catch {}

      return NextResponse.json({ record });
    }
    return NextResponse.json({ message: "Choose banner, poster, category, or philosophy content." }, { status: 400 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") return NextResponse.json({ message: "The content record was not found." }, { status: 404 });
    console.error("Admin content update failed:", error);
    return NextResponse.json({ message: "Could not update this content record." }, { status: 503 });
  }
}

export const GET = withAdminCapability(ADMIN_API_CAPABILITIES.content.methods.GET, getContent, requireAdminCapability);
export const POST = withAdminCapability(ADMIN_API_CAPABILITIES.content.methods.PATCH, createContent, requireAdminCapability, adminAuditStore);
export const PATCH = withAdminCapability(ADMIN_API_CAPABILITIES.content.methods.PATCH, updateContent, requireAdminCapability, adminAuditStore);
