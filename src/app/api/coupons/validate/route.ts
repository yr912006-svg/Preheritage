import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { resolveCustomerUser } from "@/lib/account-auth";
import { createCouponValidator } from "@/lib/coupon-service";
import { createCouponPreviewService } from "@/lib/coupon-preview";

const previewCoupon = createCouponPreviewService({
  prisma,
  validateCouponForOrder: createCouponValidator(prisma),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const emailInput = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!code || code.length > 80 || (emailInput && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput))) {
      return NextResponse.json({ valid: false, message: "Enter a valid coupon code and checkout email." }, { status: 400 });
    }

    const customer = await resolveCustomerUser();
    if (customer.status === "unavailable") {
      return NextResponse.json({ valid: false, message: "Coupon eligibility is temporarily unavailable. Please try again." }, { status: 503 });
    }
    const email = emailInput || (customer.status === "authorized" ? customer.user.email ?? "" : "");
    if (!email) {
      return NextResponse.json({ valid: false, message: "Enter the email address you will use at checkout to check coupon eligibility." }, { status: 400 });
    }

    const result = await previewCoupon({
      code,
      items: body?.items,
      email,
      userId: customer.status === "authorized" ? customer.user.id : null,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ valid: false, message: "Coupon eligibility is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
