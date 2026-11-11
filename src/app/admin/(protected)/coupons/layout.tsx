import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export default async function CouponsAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("coupons.manage");
  return children;
}
