import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { catalogProductInclude, toProductItem } from "@/lib/catalog";
import { AccountPageFrame } from "@/components/account/AccountNav";
import { WishlistGrid } from "@/components/account/WishlistGrid";

export default async function CustomerWishlistPage() {
  const user = await getCustomerUser();
  if (!user) return null;
  const items = await prisma.wishlistItem.findMany({ where: { userId: user.id, product: { status: "ACTIVE" } }, orderBy: { createdAt: "desc" }, include: { product: { include: catalogProductInclude } } });
  return <AccountPageFrame active="/account/wishlist" title="Saved Heirlooms"><WishlistGrid products={items.map((item) => toProductItem(item.product))} /></AccountPageFrame>;
}
