import { requireAdminPageCapability } from "@/lib/admin-page-access";
import CatalogTaxonomyClient from "./CatalogTaxonomyClient";

export default async function CatalogTaxonomyPage() {
  await requireAdminPageCapability("products.manage");
  return <CatalogTaxonomyClient />;
}
