import type { ReactNode } from "react";
import { requireAdminPageCapability } from "@/lib/admin-page-access";

export const metadata = {
  title: "Reviews & Q&A | PREHERITAGE Atelier Control",
};

export default async function ReviewsLayout({ children }: { children: ReactNode }) {
  await requireAdminPageCapability("reviews.moderate");
  return children;
}
