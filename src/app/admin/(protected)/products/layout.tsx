import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export default async function ProductsAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("products.read");
  return children;
}
