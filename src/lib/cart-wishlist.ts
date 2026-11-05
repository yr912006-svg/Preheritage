import type { ProductItem } from "@/lib/sample-data";

type WishlistSave = (product: ProductItem) => Promise<{ success: boolean; message?: string }>;

export async function moveCartProductToWishlist(input: {
  itemId: string;
  productId: string;
  save: WishlistSave;
  remove: (itemId: string) => void;
  fetcher?: typeof fetch;
}) {
  const fetcher = input.fetcher ?? fetch;
  try {
    const response = await fetcher(`/api/products/${encodeURIComponent(input.productId)}`, { cache: "no-store" });
    const result: { product?: ProductItem; message?: string } = await response.json();
    if (!response.ok || !result.product || result.product.id !== input.productId) {
      return { success: false as const, message: result.message || "This product could not be loaded for your wishlist." };
    }
    const saved = await input.save(result.product);
    if (!saved.success) return { success: false as const, message: saved.message || "Could not save this piece to your wishlist." };
    input.remove(input.itemId);
    return { success: true as const, message: "Saved to your wishlist." };
  } catch {
    return { success: false as const, message: "Could not save this piece. Your cart item was kept." };
  }
}
