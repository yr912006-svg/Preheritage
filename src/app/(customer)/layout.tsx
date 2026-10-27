import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { resolveCustomerUser } from "@/lib/account-auth";
import { safeAccountReturnPath } from "@/lib/customer-route-access";
import { AccountUnavailable } from "@/components/account/AccountNav";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const returnPath = safeAccountReturnPath(headers().get("x-preheritage-account-path"));
  const resolution = await resolveCustomerUser();
  if (resolution.status === "unavailable") return <AccountUnavailable />;
  if (resolution.status !== "authorized") redirect(`/login?callbackUrl=${encodeURIComponent(returnPath)}&reason=customer-required`);
  return children;
}
