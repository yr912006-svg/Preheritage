import { requireAdminPageCapability } from "@/lib/admin-page-access";
import ReviewsManagementDashboard from "./ReviewsManagementDashboard";

export default async function ReviewsPage() {
  await requireAdminPageCapability("reviews.moderate");
  return <ReviewsManagementDashboard />;
}
