import type { Prisma, PrismaClient, ReturnStatus } from "@prisma/client";
import type { AdminAuditStore, AdminCapabilityAuthorizer } from "./admin-api-access";
import type { AdminCapability } from "./admin-session-access";
import { decodeCustomerReturnRequest } from "./customer-order-actions";

export const RETURN_STAFF_TRANSITIONS = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["ITEM_RECEIVED"],
  REJECTED: [],
  ITEM_RECEIVED: [],
  REFUND_INITIATED: [],
  COMPLETED: [],
} as const satisfies Record<ReturnStatus, readonly ReturnStatus[]>;

export function canStaffTransitionReturn(from: ReturnStatus, to: ReturnStatus) {
  return RETURN_STAFF_TRANSITIONS[from].some((candidate) => candidate === to);
}

const RETURN_STATUSES = new Set<string>(Object.keys(RETURN_STAFF_TRANSITIONS));
function isReturnStatus(value: string): value is ReturnStatus {
  return RETURN_STATUSES.has(value);
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
type Wrap = (
  capability: AdminCapability,
  handler: (request: Request) => Promise<Response>,
  authorize: AdminCapabilityAuthorizer,
  auditStore?: AdminAuditStore,
) => (request: Request) => Promise<Response>;

export function createAdminReturnRequestHandlers(deps: {
  prisma: Pick<PrismaClient, "returnRequest">;
  authorize: AdminCapabilityAuthorizer;
  auditStore: AdminAuditStore;
  wrap: Wrap;
}) {
  async function listRequests(_request: Request) {
    try {
      const requests = await deps.prisma.returnRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
        select: {
          id: true, reason: true, explanation: true, status: true, createdAt: true,
          order: { select: { orderNumber: true, items: { select: { id: true, title: true, sku: true, size: true, color: true, quantity: true } } } },
        },
      } satisfies Prisma.ReturnRequestFindManyArgs);
      const results = requests.map((request) => {
        const decoded = decodeCustomerReturnRequest(request.explanation);
        const requestedIds = new Set(decoded?.itemIds ?? []);
        return {
          id: request.id,
          orderNumber: request.order.orderNumber,
          reason: request.reason,
          requestType: decoded?.requestType ?? null,
          explanation: decoded?.explanation ?? null,
          requestedItems: request.order.items.filter((item) => requestedIds.has(item.id)).map((item) => ({
            title: item.title, sku: item.sku, size: item.size, color: item.color, quantity: item.quantity,
          })),
          status: request.status,
          createdAt: request.createdAt,
        };
      });
      return Response.json({ requests: results });
    } catch (error) {
      console.error("Admin return-request lookup failed.");
      return Response.json({ message: "Could not load return requests." }, { status: 503 });
    }
  }

  async function updateRequest(request: Request) {
    try {
      const body: unknown = await request.json();
      if (!isRecord(body)) {
        return Response.json({ message: "Provide a return request and its reviewed status." }, { status: 400 });
      }
      const value = body;
      if (Object.keys(value).some((key) => !["id", "expectedStatus", "status"].includes(key)) ||
          typeof value.id !== "string" || !value.id.trim() || value.id.length > 120 ||
          typeof value.expectedStatus !== "string" || !isReturnStatus(value.expectedStatus) ||
          typeof value.status !== "string" || !isReturnStatus(value.status)) {
        return Response.json({ message: "Provide a valid return request status update." }, { status: 400 });
      }

      const id = value.id;
      const expectedStatus = value.expectedStatus;
      const nextStatus = value.status;
      if (!canStaffTransitionReturn(expectedStatus, nextStatus)) {
        return Response.json({ message: `A request in ${expectedStatus} cannot move to ${nextStatus} in this workflow.` }, { status: 409 });
      }

      const result = await deps.prisma.returnRequest.updateMany({
        where: { id, status: expectedStatus },
        data: { status: nextStatus },
      });
      if (result.count !== 1) {
        const current = await deps.prisma.returnRequest.findFirst({ where: { id }, select: { id: true } });
        if (!current) return Response.json({ message: "Return request not found." }, { status: 404 });
        return Response.json({ message: "This request changed since you opened it. Refresh and review the latest status." }, { status: 409 });
      }
      return Response.json({ success: true, request: { id, status: nextStatus } });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return Response.json({ message: "Provide valid return request details." }, { status: 400 });
      }
      console.error("Admin return-request update failed.");
      return Response.json({ message: "Could not update this return request." }, { status: 503 });
    }
  }

  return {
    GET: deps.wrap("returns.manage", listRequests, deps.authorize),
    PATCH: deps.wrap("returns.manage", updateRequest, deps.authorize, deps.auditStore),
  };
}
