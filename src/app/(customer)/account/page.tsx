import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { AccountPageFrame } from "@/components/account/AccountNav";
import { AccountSettings } from "@/components/account/AccountSettings";

export default async function CustomerAccountPage() {
  const user = await getCustomerUser();
  if (!user) redirect("/login?callbackUrl=%2Faccount&reason=customer-required");
  const [addresses, orderCount, wishlistCount] = await Promise.all([
    prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    prisma.order.count({ where: { userId: user.id } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
  ]);

  return (
    <AccountPageFrame active="/account" title={`Welcome${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}>
      <div className="grid gap-4 sm:grid-cols-3">
        {[["Orders", orderCount], ["Saved heirlooms", wishlistCount], ["Delivery addresses", addresses.length]].map(([label, value]) => (
          <div key={label} className="rounded-sm border border-ivory-300 bg-ivory-50 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wider text-charcoal-400">{label}</p>
            <p className="mt-2 font-serif text-2xl font-bold text-charcoal-900">{value}</p>
          </div>
        ))}
      </div>
      <AccountSettings profile={{ ...user, dob: user.dob?.toISOString().slice(0, 10) ?? "" }} addresses={addresses} />
    </AccountPageFrame>
  );
}
