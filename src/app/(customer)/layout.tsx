import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCustomerUser } from "@/lib/account-auth";
import { safeAccountReturnPath } from "@/lib/customer-route-access";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const returnPath = safeAccountReturnPath(headers().get("x-preheritage-account-path"));
  const user = await getCustomerUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(returnPath)}&reason=customer-required`);
  return children;
}
