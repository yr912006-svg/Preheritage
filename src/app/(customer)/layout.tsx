import { redirect } from "next/navigation";
import { getCustomerUser } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCustomerUser();
  if (!user) redirect("/login?callbackUrl=%2Faccount");
  return children;
}
