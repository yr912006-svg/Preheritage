import type { PrismaClient } from "@prisma/client";
import type { AdminCapabilityAuthorizer, AdminAuditStore } from "./admin-api-access";
import type { AdminCapability } from "./admin-session-access";

type InventoryDatabase = Pick<PrismaClient, "product" | "productVariant">;
type InventoryHandlerWrapper = (
  capability: AdminCapability,
  handler: (request: Request) => Promise<Response>,
  authorize: AdminCapabilityAuthorizer,
  auditStore?: AdminAuditStore,
) => (request: Request) => Promise<Response>;

export function createAdminInventoryHandlers(dependencies: {
  prisma: InventoryDatabase;
  authorize: AdminCapabilityAuthorizer;
  auditStore: AdminAuditStore;
  wrap: InventoryHandlerWrapper;
  readCapability: AdminCapability;
  mutationCapability: AdminCapability;
  getSellableStock: (product: { stock: number; status?: string; variants?: { stock: number; isActive?: boolean }[] }) => number;
}) {
  const { prisma, authorize, auditStore, wrap, readCapability, mutationCapability, getSellableStock } = dependencies;

  async function getInventory(_request: Request) {
    try {
      const products = await prisma.product.findMany({ where: { status: { not: "ARCHIVED" } }, orderBy: { title: "asc" }, select: { id: true, title: true, sku: true, stock: true, status: true, lowStockAlert: true, variants: { select: { id: true, sku: true, size: true, color: true, stock: true } }, images: { orderBy: { orderIndex: "asc" }, take: 1, select: { url: true } } } });
      return Response.json({ inventory: products.map((product) => ({ ...product, stock: getSellableStock(product), image: product.images[0]?.url || "" })) });
    } catch (error) {
      console.error("Admin inventory lookup failed:", error);
      return Response.json({ message: "Could not load inventory." }, { status: 503 });
    }
  }

  async function adjustInventory(request: Request) {
    try {
      const body = await request.json();
      const productId = typeof body?.productId === "string" ? body.productId : "";
      const variantId = typeof body?.variantId === "string" ? body.variantId : "";
      const delta = Number(body?.delta);
      if (!productId || !Number.isInteger(delta) || Math.abs(delta) !== 1) return Response.json({ message: "Invalid inventory adjustment." }, { status: 400 });
      const current = await prisma.product.findFirst({ where: { id: productId, status: { not: "ARCHIVED" } }, include: { variants: { select: { id: true } } } });
      if (!current) return Response.json({ message: "Product not found." }, { status: 404 });

      let updateCount: number;
      if (current.variants.length) {
        if (!variantId || !current.variants.some((variant) => variant.id === variantId)) return Response.json({ message: "Choose a product variant to adjust its stock." }, { status: 400 });
        const update = await prisma.productVariant.updateMany({ where: { id: variantId, productId, ...(delta < 0 ? { stock: { gte: 1 } } : { stock: { gte: 0, lt: 100000 } }) }, data: { stock: { increment: delta } } });
        updateCount = update.count;
      } else {
        if (variantId) return Response.json({ message: "This product has no variants." }, { status: 400 });
        const update = await prisma.product.updateMany({ where: { id: productId, status: { not: "ARCHIVED" }, ...(delta < 0 ? { stock: { gte: 1 } } : { stock: { gte: 0, lt: 100000 } }) }, data: { stock: { increment: delta } } });
        updateCount = update.count;
      }
      if (!updateCount) return Response.json({ message: delta < 0 ? "Stock cannot go below zero." : "Product not found." }, { status: 409 });
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, stock: true, status: true, lowStockAlert: true, variants: { select: { id: true, sku: true, size: true, color: true, stock: true } } } });
      return Response.json({ product: product && { ...product, stock: getSellableStock(product) } });
    } catch (error) {
      console.error("Inventory adjustment failed:", error);
      return Response.json({ message: "Could not update inventory." }, { status: 503 });
    }
  }

  return {
    GET: wrap(readCapability, getInventory, authorize),
    PATCH: wrap(mutationCapability, adjustInventory, authorize, auditStore),
  };
}
