import { NextResponse } from "next/server";
import { TicketStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdminCapability } from "@/lib/account-auth";
import { ADMIN_API_CAPABILITIES, withAdminCapability } from "@/lib/admin-api-access";
import { adminAuditStore } from "@/lib/admin-audit";

async function getInquiries(_request: Request) {
  try {
    const inquiries = await prisma.supportTicket.findMany({
      where: { category: "GENERAL" }, orderBy: { createdAt: "desc" }, take: 500,
      select: { id: true, guestName: true, guestEmail: true, guestPhone: true, subject: true, message: true, status: true, createdAt: true },
    });
    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error("Admin inquiry lookup failed:", error);
    return NextResponse.json({ message: "Could not load inquiries." }, { status: 503 });
  }
}

async function updateInquiry(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    const status = typeof body?.status === "string" ? body.status : "";
    const statusMap: Record<string, TicketStatus> = { NEW: "OPEN", IN_PROGRESS: "IN_PROGRESS", RESOLVED: "RESOLVED" };
    if (!id || !statusMap[status]) return NextResponse.json({ message: "Choose a valid inquiry status." }, { status: 400 });
    const updated = await prisma.supportTicket.updateMany({ where: { id, category: "GENERAL" }, data: { status: statusMap[status] } });
    if (!updated.count) return NextResponse.json({ message: "Inquiry not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin inquiry update failed:", error);
    return NextResponse.json({ message: "Could not update this inquiry." }, { status: 503 });
  }
}

async function deleteInquiry(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ message: "Inquiry ID is required." }, { status: 400 });
    const deleted = await prisma.supportTicket.deleteMany({ where: { id, category: "GENERAL" } });
    if (!deleted.count) return NextResponse.json({ message: "Inquiry not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin inquiry deletion failed:", error);
    return NextResponse.json({ message: "Could not delete this inquiry." }, { status: 503 });
  }
}

function createAdminInquiryHandlers(authorize = requireAdminCapability) {
  return {
    GET: withAdminCapability(ADMIN_API_CAPABILITIES.generalInquiries.methods.GET, getInquiries, authorize),
    PATCH: withAdminCapability(ADMIN_API_CAPABILITIES.generalInquiries.methods.PATCH, updateInquiry, authorize, adminAuditStore),
    DELETE: withAdminCapability(ADMIN_API_CAPABILITIES.generalInquiries.methods.DELETE, deleteInquiry, authorize, adminAuditStore),
  };
}

const handlers = createAdminInquiryHandlers();
export const { GET, PATCH, DELETE } = handlers;
