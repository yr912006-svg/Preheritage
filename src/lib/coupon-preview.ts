import { normalizeCheckoutItems } from "@/lib/cart-model";

export type CouponPreviewPrisma = {
  product: any;
};

export function createCouponPreviewService(input: {
  prisma: CouponPreviewPrisma;
  validateCouponForOrder: (input: { code: string; subtotal: number; email: string; userId?: string | null }) => Promise<any>;
}) {
  return async function previewCoupon(request: {
    code: string;
    items: unknown;
    email: string;
    userId?: string | null;
  }) {
    const cart = normalizeCheckoutItems(request.items);
    if (cart.error || cart.items.length === 0) {
      return { valid: false as const, message: cart.error || "Add an item to your bag before applying a coupon." };
    }

    const productIds = Array.from(new Set(cart.items.map((item) => item.productId)));
    const products = await input.prisma.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      include: { variants: true },
    });
    if (products.length !== productIds.length) {
      return { valid: false as const, message: "One or more items are no longer available. Refresh your bag and try again." };
    }

    const byId = new Map(products.map((product: any) => [product.id, product]));
    let subtotal = 0;
    for (const item of cart.items) {
      const product: any = byId.get(item.productId);
      let variant: any = null;
      if (product.variants.length > 0) {
        variant = item.variantId ? product.variants.find((entry: any) => entry.id === item.variantId) : null;
        if (!variant || variant.stock < item.quantity) {
          return { valid: false as const, message: `The selected option for ${product.title} is unavailable or out of stock.` };
        }
      } else if (item.variantId) {
        return { valid: false as const, message: `The selected option for ${product.title} is no longer available.` };
      } else if (product.stock < item.quantity) {
        return { valid: false as const, message: `Insufficient stock for ${product.title}.` };
      }

      const unitPrice = Number(product.price) + Number(variant?.additionalPrice ?? 0);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return { valid: false as const, message: `The price for ${product.title} could not be verified.` };
      }
      subtotal += unitPrice * item.quantity;
    }

    const result = await input.validateCouponForOrder({
      code: request.code,
      subtotal,
      email: request.email,
      userId: request.userId,
    });
    if (!result.valid) return result;
    return {
      valid: true as const,
      code: result.coupon?.code ?? request.code.trim().toUpperCase(),
      subtotal,
      discountAmount: result.discountAmount,
      freeShipping: result.freeShipping,
    };
  };
}
