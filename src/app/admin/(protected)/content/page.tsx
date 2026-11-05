import { requireAdminPageCapability } from "@/lib/admin-page-access";
import ContentDashboard from "./ContentDashboard";

export default async function ContentPage() {
  await requireAdminPageCapability("content.manage");
  return <ContentDashboard />;
}
