import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { resolveCustomerUser } from "@/lib/account-auth";
import { AccountPageFrame } from "@/components/account/AccountNav";
import { AccountSettings } from "@/components/account/AccountSettings";
import { AccountUnavailable } from "@/components/account/AccountNav";
import { loadAccountOverview } from "@/lib/account-overview";

export default async function CustomerAccountPage() {
  const resolution = await resolveCustomerUser();
  if (resolution.status === "unavailable") return <AccountUnavailable />;
  if (resolution.status !== "authorized") redirect("/login?callbackUrl=%2Faccount&reason=customer-required");
  const { user } = resolution;
  const overview = await loadAccountOverview(user.id, prisma);
  if (!overview) return <AccountUnavailable />;
  const { addresses, orderCount, wishlistCount } = overview;

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
