import { redirect } from "next/navigation";
import { disabledOtpLoginRedirect } from "@/lib/customer-route-access";

export default function OtpLoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  redirect(disabledOtpLoginRedirect(searchParams?.callbackUrl));
}
