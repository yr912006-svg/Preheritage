export type ReorderLineResult = {
  orderItemTitle: string;
  status: "added" | "partial" | "unavailable" | "invalid";
  addedQuantity: number;
  requestedQuantity: number | null;
  previousPrice: number | null;
  currentPrice: number | null;
  priceChanged: boolean;
  message: string;
};

export function createOrderReorderService(prisma: any) {
  return {
    async reorder(userId: string | null | undefined, orderNumber: string) {
      if (!userId) return { status: "unauthorized" as const };
      const order = await prisma.order.findFirst({ where: { orderNumber, userId }, select: { items: { select: { productId: true, variantId: true, title: true, quantity: true, price: true } } } });
      if (!order) return { status: "not-found" as const };

      const lines: ReorderLineResult[] = await prisma.$transaction(async (tx: any) => {
        const results: ReorderLineResult[] = [];
        for (const item of order.items) {
          const previousPrice = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : null;
          const requestedQuantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : null;
          if (typeof item.productId !== "string" || !item.productId || requestedQuantity === null) {
            results.push({ orderItemTitle: item.title || "Previous item", status: "invalid", addedQuantity: 0, requestedQuantity, previousPrice, currentPrice: null, priceChanged: false, message: "Saved order details could not be verified." });
            continue;
          }

          const product = await tx.product.findUnique({ where: { id: item.productId }, include: { images: { orderBy: { orderIndex: "asc" }, take: 1 }, variants: true } });
          if (!product || product.status !== "ACTIVE") {
            results.push({ orderItemTitle: item.title || "Previous item", status: "unavailable", addedQuantity: 0, requestedQuantity, previousPrice, currentPrice: null, priceChanged: false, message: "Product is no longer available." });
            continue;
          }

          let variant: any = null;
          if (item.variantId) variant = product.variants.find((entry: any) => entry.id === item.variantId) ?? null;
          if ((item.variantId && !variant) || (!item.variantId && product.variants.length > 0) || (variant?.isActive === false)) {
            results.push({ orderItemTitle: item.title || product.title, status: "unavailable", addedQuantity: 0, requestedQuantity, previousPrice, currentPrice: null, priceChanged: false, message: "The original size or colour selection is no longer available." });
            continue;
          }

          const stock = Number(variant?.stock ?? product.stock);
          const currentPrice = Number(product.price) + Number(variant?.additionalPrice ?? 0);
          if (!Number.isInteger(stock) || stock < 1 || !Number.isFinite(currentPrice) || currentPrice <= 0) {
            results.push({ orderItemTitle: item.title || product.title, status: "unavailable", addedQuantity: 0, requestedQuantity, previousPrice, currentPrice: Number.isFinite(currentPrice) ? currentPrice : null, priceChanged: false, message: "This item is currently out of stock or its price could not be verified." });
            continue;
          }

          const variantId = variant?.id ?? null;
          const existing = await tx.cartItem.findFirst({ where: { userId, productId: product.id, variantId } });
          if (existing && (!Number.isInteger(existing.quantity) || existing.quantity < 1)) {
            results.push({ orderItemTitle: item.title || product.title, status: "invalid", addedQuantity: 0, requestedQuantity, previousPrice, currentPrice, priceChanged: false, message: "Your existing cart quantity needs attention; no changes were made to this item." });
            continue;
          }
          const currentQuantity = existing ? existing.quantity : 0;
          const maxAllowed = Math.min(stock, 20);
          const addQuantity = Math.max(0, Math.min(requestedQuantity, maxAllowed - currentQuantity));
          const priceChanged = previousPrice === null || Math.round(previousPrice * 100) !== Math.round(currentPrice * 100);
          if (addQuantity > 0) {
            const quantity = currentQuantity + addQuantity;
            if (existing) {
              const updated = await tx.cartItem.updateMany({ where: { id: existing.id, userId, quantity: currentQuantity }, data: { quantity } });
              if (updated.count !== 1) {
                results.push({ orderItemTitle: item.title || product.title, status: "partial", addedQuantity: 0, requestedQuantity, previousPrice, currentPrice, priceChanged, message: "Your cart changed during this update. No quantity was added for this item; review your cart and retry." });
                continue;
              }
            } else await tx.cartItem.create({ data: { userId, productId: product.id, variantId, quantity } });
          }
          const partial = addQuantity < requestedQuantity;
          const details = priceChanged ? ` Current price ${currentPrice.toFixed(2)} differs from the previous recorded price${previousPrice === null ? " (unavailable)" : ` ${previousPrice.toFixed(2)}`}.` : "";
          const stockMessage = partial ? ` Added ${addQuantity} of ${requestedQuantity}; the rest exceeds available stock or the cart limit.` : ` Added ${addQuantity} to your cart.`;
          results.push({ orderItemTitle: item.title || product.title, status: addQuantity === 0 ? "unavailable" : partial ? "partial" : "added", addedQuantity: addQuantity, requestedQuantity, previousPrice, currentPrice, priceChanged, message: `${stockMessage}${details}` });
        }
        return results;
      });

      return { status: "processed" as const, lines };
    },
  };
}
