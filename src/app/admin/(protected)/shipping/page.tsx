import { requireAdminPageCapability } from "@/lib/admin-page-access";
import ShippingRulesDashboard from "./ShippingRulesDashboard";

export default async function ShippingPage() {
  await requireAdminPageCapability("orders.manage");
  return <ShippingRulesDashboard />;
}
