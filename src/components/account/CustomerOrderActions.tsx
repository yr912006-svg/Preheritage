"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { canCustomerCancelOrder, decodeCustomerReturnRequest } from "@/lib/customer-order-actions";

type Item = { id: string; title: string; quantity: number; size: string | null; color: string | null };
type PriorRequest = { id: string; reason: string; explanation: string | null; status: string; createdAt: Date | string };
const ACTIVE_STATUSES = new Set(["REQUESTED", "APPROVED", "ITEM_RECEIVED", "REFUND_INITIATED"]);

export function CustomerOrderActions({ orderId, status, paymentStatus, items, requests }: {
  orderId: string; status: string; paymentStatus: string; items: Item[]; requests: PriorRequest[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestType, setRequestType] = useState<"RETURN" | "EXCHANGE">("RETURN");
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [itemIds, setItemIds] = useState<string[]>(items.map((item) => item.id));
  const canCancel = canCustomerCancelOrder(status, paymentStatus);
  const activeRequest = requests.some((request) => ACTIVE_STATUSES.has(request.status));

  const cancelOrder = async () => {
    if (busy || !window.confirm("Cancel this order? This cannot be undone.")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/account/orders/${orderId}/cancel`, { method: "POST" });
      const result = await response.json();
      setMessage(result.message || (response.ok ? "Order cancelled." : "We could not cancel this order."));
      if (response.ok) router.refresh();
    } catch { setMessage("We could not cancel this order. Please retry."); }
    finally { setBusy(false); }
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/account/orders/${orderId}/returns`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType, reason, explanation, itemIds }),
      });
      const result = await response.json();
      setMessage(result.message || "We could not submit your request.");
      if (response.ok) router.refresh();
    } catch { setMessage("We could not submit your request. Please retry."); }
    finally { setBusy(false); }
  };

  return <div className="mt-4 space-y-4 border-t border-ivory-200 pt-4">
    {canCancel && <button type="button" disabled={busy} onClick={() => void cancelOrder()} className="rounded border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-800 disabled:opacity-50">{busy ? "Processing…" : "Cancel order"}</button>}

    {requests.length > 0 && <section className="space-y-2" aria-label="Return and exchange request status">
      {requests.map((request) => {
        const details = decodeCustomerReturnRequest(request.explanation);
        const affectedTitles = items.filter((item) => details?.itemIds.includes(item.id)).map((item) => item.title);
        return <div key={request.id} className="rounded border border-ivory-300 bg-white p-3 text-xs">
          <p className="font-semibold text-charcoal-900">{details?.requestType === "EXCHANGE" ? "Exchange" : "Return"} request: {request.status.replaceAll("_", " ")}</p>
          <p className="mt-1 text-charcoal-500">Reason: {request.reason}{affectedTitles.length ? ` · Items: ${affectedTitles.join(", ")}` : ""}</p>
        </div>;
      })}
    </section>}

    {status === "DELIVERED" && !activeRequest && <form onSubmit={submitRequest} className="space-y-3 rounded border border-ivory-300 bg-white p-4">
      <h3 className="font-semibold text-charcoal-900">Request a return or exchange</h3>
      <label className="block text-xs font-medium text-charcoal-600">Request type
        <select value={requestType} onChange={(event) => setRequestType(event.target.value as "RETURN" | "EXCHANGE")} className="mt-1 w-full rounded border border-ivory-300 p-2">
          <option value="RETURN">Return</option><option value="EXCHANGE">Exchange</option>
        </select>
      </label>
      <fieldset className="space-y-2"><legend className="text-xs font-medium text-charcoal-600">Items from this order</legend>
        {items.map((item) => <label key={item.id} className="flex items-center gap-2 text-xs text-charcoal-600">
          <input type="checkbox" checked={itemIds.includes(item.id)} onChange={(event) => setItemIds((previous) => event.target.checked ? [...previous, item.id] : previous.filter((id) => id !== item.id))} />
          {item.title} × {item.quantity}{item.size || item.color ? ` · ${[item.size, item.color].filter(Boolean).join(" / ")}` : ""}
        </label>)}
      </fieldset>
      <label className="block text-xs font-medium text-charcoal-600">Reason
        <input required maxLength={120} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded border border-ivory-300 p-2" placeholder="For example, wrong size" />
      </label>
      <label className="block text-xs font-medium text-charcoal-600">Additional details (optional)
        <textarea maxLength={1000} value={explanation} onChange={(event) => setExplanation(event.target.value)} className="mt-1 w-full rounded border border-ivory-300 p-2" rows={3} />
      </label>
      <button type="submit" disabled={busy || itemIds.length === 0} className="rounded bg-charcoal-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit for review"}</button>
      <p className="text-[11px] text-charcoal-500">Submitting a request does not mean it has been approved.</p>
    </form>}
    {message && <p role="status" className="text-xs text-charcoal-600">{message}</p>}
  </div>;
}
