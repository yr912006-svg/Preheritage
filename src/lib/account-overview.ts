import type { Address } from "@prisma/client";

export type AccountOverview = {
  addresses: Address[];
  orderCount: number;
  wishlistCount: number;
};

/** Load account overview data without allowing a secondary query failure to crash the route. */
export async function loadAccountOverview(userId: string, db: any): Promise<AccountOverview | null> {
  try {
    const [addresses, orderCount, wishlistCount] = await Promise.all([
      db.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
      db.order.count({ where: { userId } }),
      db.wishlistItem.count({ where: { userId } }),
    ]);
    return { addresses, orderCount, wishlistCount };
  } catch {
    return null;
  }
}
