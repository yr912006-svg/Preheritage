export type CartQuantitySyncResult = { success: true } | { success: false; message: string };

export async function persistCartQuantityUpdate(
  quantity: number,
  persist: () => Promise<{ ok: boolean; message?: string }>,
): Promise<CartQuantitySyncResult> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return { success: false, message: "Choose a quantity between 1 and 20." };
  }
  try {
    const result = await persist();
    return result.ok
      ? { success: true }
      : { success: false, message: result.message || "We could not update the cart. Please retry." };
  } catch {
    return { success: false, message: "We could not reach the store to update your cart. Please retry." };
  }
}
