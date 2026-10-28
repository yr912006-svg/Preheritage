import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export default async function NewProductAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("products.manage");
  return children;
}
