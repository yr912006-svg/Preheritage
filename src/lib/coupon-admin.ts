import type { AdminCapabilityAuthorizer, AdminAuditStore } from "./admin-api-access";
import type { AdminCapability } from "./admin-session-access";

const EDITABLE = ["code", "description", "discountType", "discountValue", "minOrderValue", "maxDiscount", "usageLimit", "usagePerUser", "startDate", "endDate", "firstOrderOnly", "freeShipping"] as const;
const ALLOWED = new Set<string>([...EDITABLE, "id", "isActive"]);
const TYPES = new Set(["PERCENTAGE", "FIXED"]);

export type CouponInput = Record<string, unknown>;
export type CouponFields = {
  code?: string; description?: string | null; discountType?: string; discountValue?: number;
  minOrderValue?: number; maxDiscount?: number | null; usageLimit?: number | null; usagePerUser?: number;
  startDate?: Date; endDate?: Date; firstOrderOnly?: boolean; freeShipping?: boolean;
};

export function normalizeCouponInput(value: unknown, partial = false): { ok: true; data: CouponFields } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, message: "Provide coupon details." };
  const body = value as CouponInput;
  const unknown = Object.keys(body).find((key) => !ALLOWED.has(key));
  if (unknown) return { ok: false, message: `Unexpected field: ${unknown}.` };
  const data: CouponFields = {};
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key);
  if (!partial || has("code")) {
    if (typeof body.code !== "string") return { ok: false, message: "Enter a coupon code." };
    const code = body.code.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) return { ok: false, message: "Use 3–40 letters, numbers, hyphens, or underscores for the code." };
    data.code = code;
  }
  if (!partial || has("discountType")) {
    if (typeof body.discountType !== "string" || !TYPES.has(body.discountType)) return { ok: false, message: "Choose Percentage or Fixed discount." };
    data.discountType = body.discountType;
  }
  if (!partial || has("discountValue")) {
    const amount = body.discountValue;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return { ok: false, message: "Discount value must be greater than zero." };
    if ((body.discountType === "PERCENTAGE" || (!has("discountType") && value && (value as any).currentType === "PERCENTAGE")) && amount > 100) return { ok: false, message: "Percentage discounts cannot exceed 100%." };
    data.discountValue = amount;
  }
  if (!partial || has("description")) {
    if (body.description !== undefined && body.description !== null && (typeof body.description !== "string" || body.description.trim().length > 240)) return { ok: false, message: "Description must be 240 characters or fewer." };
    data.description = typeof body.description === "string" ? body.description.trim() || null : null;
  }
  for (const key of ["minOrderValue", "maxDiscount"] as const) if (!partial || has(key)) {
    const input = body[key];
    if (key === "maxDiscount" && (input === null || input === undefined || input === "")) { data.maxDiscount = null; continue; }
    if (typeof input !== "number" || !Number.isFinite(input) || input < 0 || (key === "maxDiscount" && input === 0)) return { ok: false, message: key === "minOrderValue" ? "Minimum order must be zero or greater." : "Maximum discount must be greater than zero." };
    data[key] = input;
  }
  for (const key of ["usageLimit", "usagePerUser"] as const) if (!partial || has(key)) {
    const input = body[key];
    if (key === "usageLimit" && (input === null || input === undefined || input === "")) { data.usageLimit = null; continue; }
    if (typeof input !== "number" || !Number.isSafeInteger(input) || input <= 0) return { ok: false, message: key === "usageLimit" ? "Usage limit must be a positive whole number or unlimited." : "Per-customer limit must be a positive whole number." };
    data[key] = input;
  }
  for (const key of ["startDate", "endDate"] as const) if (!partial || has(key)) {
    const input = body[key];
    const date = input instanceof Date ? input : typeof input === "string" ? new Date(input) : null;
    if (!date || !Number.isFinite(date.getTime())) return { ok: false, message: `Enter a valid ${key === "startDate" ? "start" : "end"} date.` };
    data[key] = date;
  }
  for (const key of ["firstOrderOnly", "freeShipping"] as const) if (!partial || has(key)) {
    if (body[key] !== undefined && typeof body[key] !== "boolean") return { ok: false, message: `Invalid ${key === "firstOrderOnly" ? "first-order" : "free-shipping"} setting.` };
    (data as any)[key] = body[key] === true;
  }
  if (!partial && (!data.endDate || !data.discountType || !data.discountValue)) return { ok: false, message: "Complete all required coupon fields." };
  if (data.startDate && data.endDate && data.startDate >= data.endDate) return { ok: false, message: "End date must be after start date." };
  return { ok: true, data };
}

type Wrap = (capability: AdminCapability, handler: (request: Request) => Promise<Response>, authorize: AdminCapabilityAuthorizer, auditStore?: AdminAuditStore) => (request: Request) => Promise<Response>;
type CouponDb = { coupon: any };

export function createAdminCouponHandlers(deps: { prisma: CouponDb; authorize: AdminCapabilityAuthorizer; auditStore: AdminAuditStore; wrap: Wrap }) {
  const { prisma } = deps;
  async function list() {
    try { return Response.json({ coupons: await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }) }); }
    catch (error) { console.error("Admin coupon lookup failed:", error); return Response.json({ message: "Could not load coupons." }, { status: 503 }); }
  }
  async function create(request: Request) {
    try {
      const normalized = normalizeCouponInput(await request.json());
      if (normalized.ok === false) return Response.json({ message: normalized.message }, { status: 400 });
      const data = normalized.data;
      if (data.discountType === "PERCENTAGE" && (data.discountValue! > 100 || (data.maxDiscount != null && data.maxDiscount <= 0))) return Response.json({ message: "Percentage discounts must be at most 100% and have a positive optional maximum." }, { status: 400 });
      const coupon = await prisma.coupon.create({ data: { ...data, isActive: true } });
      return Response.json({ coupon }, { status: 201 });
    } catch (error: any) {
      if (error?.code === "P2002") return Response.json({ message: "That coupon code is already in use." }, { status: 409 });
      console.error("Admin coupon creation failed:", error); return Response.json({ message: "Could not create this coupon." }, { status: 503 });
    }
  }
  async function update(request: Request) {
    try {
      const body = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.id !== "string" || !body.id.trim()) return Response.json({ message: "Choose a coupon to update." }, { status: 400 });
      if (Object.keys(body).some((key) => !ALLOWED.has(key))) return Response.json({ message: "The update contains an unsupported field." }, { status: 400 });
      const current = await prisma.coupon.findUnique({ where: { id: body.id }, select: { id: true, discountType: true, startDate: true, endDate: true, usedCount: true } });
      if (!current) return Response.json({ message: "Coupon not found." }, { status: 404 });
      if (Object.keys(body).length === 2 && typeof body.isActive === "boolean") {
        const result = await prisma.coupon.updateMany({ where: { id: current.id }, data: { isActive: body.isActive } });
        if (!result.count) return Response.json({ message: "Coupon changed during this update. Refresh and try again." }, { status: 409 });
      } else {
        if ("isActive" in body) return Response.json({ message: "Activation status must be changed by itself." }, { status: 400 });
        const normalized = normalizeCouponInput(body, true);
        if (normalized.ok === false) return Response.json({ message: normalized.message }, { status: 400 });
        const patch = normalized.data;
        const startDate = patch.startDate ?? current.startDate;
        const endDate = patch.endDate ?? current.endDate;
        const discountType = patch.discountType ?? current.discountType;
        if (startDate >= endDate) return Response.json({ message: "End date must be after start date." }, { status: 400 });
        if (discountType === "PERCENTAGE" && patch.discountValue !== undefined && patch.discountValue > 100) return Response.json({ message: "Percentage discounts cannot exceed 100%." }, { status: 400 });
        if (patch.usageLimit !== undefined && patch.usageLimit !== null && current.usedCount > patch.usageLimit) return Response.json({ message: "Usage limit cannot be lower than coupons already used." }, { status: 409 });
        const update = await prisma.coupon.updateMany({ where: { id: current.id, ...(patch.usageLimit != null ? { usedCount: { lte: patch.usageLimit } } : {}) }, data: patch });
        if (!update.count) return Response.json({ message: "Coupon changed during this update. Refresh and try again." }, { status: 409 });
      }
      const coupon = await prisma.coupon.findUnique({ where: { id: current.id } });
      return Response.json({ coupon });
    } catch (error: any) {
      if (error?.code === "P2002") return Response.json({ message: "That coupon code is already in use." }, { status: 409 });
      console.error("Admin coupon update failed:", error); return Response.json({ message: "Could not update this coupon." }, { status: 503 });
    }
  }
  return {
    GET: deps.wrap("coupons.manage", list, deps.authorize),
    POST: deps.wrap("coupons.manage", create, deps.authorize, deps.auditStore),
    PATCH: deps.wrap("coupons.manage", update, deps.authorize, deps.auditStore),
  };
}
