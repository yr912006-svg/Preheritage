import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getCustomerUser } from "@/lib/account-auth";
import { CUSTOMER_PASSWORD_POLICY_MESSAGE, isValidCustomerPassword } from "@/lib/customer-password-policy";

export async function PATCH(request: Request) {
  const customer = await getCustomerUser();
  if (!customer) return NextResponse.json({ message: "Please sign in to change your password." }, { status: 401 });

  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ message: "Please check the password fields." }, { status: 400 });
    const fields = body as Record<string, unknown>;
    const currentPassword = fields.currentPassword;
    const newPassword = fields.newPassword;
    if (typeof currentPassword !== "string" || currentPassword.length < 1 || currentPassword.length > 200 ||
        !isValidCustomerPassword(newPassword)) {
      return NextResponse.json({ message: `Enter your current password. ${CUSTOMER_PASSWORD_POLICY_MESSAGE}` }, { status: 400 });
    }
    if (currentPassword === newPassword) return NextResponse.json({ message: "Choose a new password different from your current one." }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: { id: customer.id, role: "CUSTOMER", isActive: true },
      select: { passwordHash: true },
    });
    if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ message: "Your current password is incorrect, or this account uses a different sign-in method." }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.updateMany({
      where: { id: customer.id, role: "CUSTOMER", isActive: true, passwordHash: user.passwordHash },
      data: { passwordHash },
    });
    if (updated.count !== 1) return NextResponse.json({ message: "Your account or password changed while this request was being processed. Please sign in again." }, { status: 409 });
    return NextResponse.json({ success: true, message: "Password updated. Please sign in again." });
  } catch {
    return NextResponse.json({ message: "We could not change your password. Please try again." }, { status: 503 });
  }
}
