import type { Prisma, PrismaClient } from "@prisma/client";

const RECENT_WINDOW_MS = 10 * 60_000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;
const MAX_TRACKED_CLIENTS = 10_000;

export type InquiryCreateData = {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  subject: string;
  message: string;
  category: "GENERAL";
  status: "OPEN";
  userId?: string;
};

type InquiryStore = {
  supportTicket: {
    create(args: { data: InquiryCreateData; select: { id: true } }): Promise<{ id: string }>;
  };
};

type InquiryCustomer = { id: string } | null;

export type CustomerInquiry = Prisma.SupportTicketGetPayload<{
  select: { id: true; subject: true; status: true; createdAt: true; updatedAt: true };
}>;

export async function loadCustomerInquiries(
  db: Pick<PrismaClient, "supportTicket">,
  userId: string,
): Promise<{ status: "loaded"; inquiries: CustomerInquiry[] } | { status: "unavailable" }> {
  try {
    const inquiries = await db.supportTicket.findMany({
      where: { userId, category: "GENERAL" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, subject: true, status: true, createdAt: true, updatedAt: true },
    });
    return { status: "loaded", inquiries };
  } catch {
    return { status: "unavailable" };
  }
}

function normalizeInquiryBody(value: unknown): Omit<InquiryCreateData, "category" | "status" | "userId"> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (name.length < 2 || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      phone.length > 40 || (phone && !/^\+?[\d\s()\-.]{7,40}$/.test(phone)) ||
      subject.length < 2 || subject.length > 160 || message.length < 10 || message.length > 5000) return null;
  return { guestName: name, guestEmail: email, ...(phone ? { guestPhone: phone } : {}), subject, message };
}

function allowsSubmission(submissions: Map<string, number[]>, clientKey: string, now: number): boolean {
  submissions.forEach((times, key) => {
    const recent = times.filter((time) => now - time < RECENT_WINDOW_MS);
    if (recent.length) submissions.set(key, recent);
    else submissions.delete(key);
  });
  if (!submissions.has(clientKey) && submissions.size >= MAX_TRACKED_CLIENTS) return false;
  const recent = submissions.get(clientKey) ?? [];
  if (recent.length >= MAX_SUBMISSIONS_PER_WINDOW) return false;
  recent.push(now);
  submissions.set(clientKey, recent);
  return true;
}

export function createInquiryPostHandler(dependencies: {
  store: InquiryStore;
  getCustomer: () => Promise<InquiryCustomer>;
  submissions?: Map<string, number[]>;
  now?: () => number;
  clientKey?: (request: Request) => string;
}) {
  const submissions = dependencies.submissions ?? new Map<string, number[]>();
  const now = dependencies.now ?? Date.now;
  const clientKey = dependencies.clientKey ?? ((request: Request) =>
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 128) || "unknown");

  return async function POST(request: Request): Promise<Response> {
    let body: unknown;
    try { body = await request.json(); }
    catch { return Response.json({ message: "Please check your name, contact details, subject, and message." }, { status: 400 }); }
    if (body && typeof body === "object" && !Array.isArray(body) &&
        typeof (body as Record<string, unknown>).website === "string" &&
        ((body as Record<string, unknown>).website as string).trim()) {
      return Response.json({ success: true });
    }
    const input = normalizeInquiryBody(body);
    if (!input) return Response.json({ message: "Please check your name, contact details, subject, and message." }, { status: 400 });

    const timestamp = now();
    if (!allowsSubmission(submissions, clientKey(request), timestamp)) {
      return Response.json({ message: "Please wait before sending another inquiry." }, { status: 429 });
    }

    try {
      const customer = await dependencies.getCustomer();
      const inquiry = await dependencies.store.supportTicket.create({
        data: { ...input, category: "GENERAL", status: "OPEN", ...(customer ? { userId: customer.id } : {}) },
        select: { id: true },
      });
      return Response.json({ success: true, id: inquiry.id }, { status: 201 });
    } catch (error) {
      console.error("Customer inquiry submission failed:", error);
      return Response.json({ message: "We could not save your inquiry. Please try again." }, { status: 503 });
    }
  };
}
