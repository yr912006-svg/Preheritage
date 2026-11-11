# Razorpay webhook recovery

## Required configuration

- Set `RAZORPAY_WEBHOOK_SECRET` in the server environment for each Razorpay mode. It must be the webhook secret configured in that mode's Razorpay Dashboard; it is separate from `RAZORPAY_KEY_SECRET`.
- Keep `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` configured server-side so the webhook can fetch the current Razorpay order and payment.
- Configure the Dashboard webhook URL as `https://<deployed-host>/api/razorpay/webhook` over HTTPS. Configure test and live modes separately and subscribe to `payment.captured` and `payment.failed`.
- Do not publish the webhook secret in a `NEXT_PUBLIC_*` variable, client bundle, or source control. The existing `.env.example` contains a placeholder only.
- Apply the reviewed database migration to the intended development branch before enabling this endpoint. Confirm the branch/connection target before any migration operation. Production setup requires separate approval.

## Processing and recovery

The endpoint verifies `X-Razorpay-Signature` against the exact raw request body and requires `X-Razorpay-Event-Id`. The unique event ID and payload hash prevent duplicate processing and detect event-ID reuse. Payment status and amount come from Razorpay's API, never the event snapshot. Captured payments are finalized from the saved checkout snapshot only after current product prices, coupon eligibility, account status, and stock are revalidated.

If finalization cannot safely complete, the checkout and event are retained as `RECOVERY_REQUIRED`. Authorized staff can inspect `/api/admin/payments/reconciliation` with `orders.read` and request a fresh provider check and finalization attempt with `orders.manage`. This endpoint does not issue refunds. Captured payments that cannot be matched to a checkout snapshot remain manual-review records and require review in Razorpay Dashboard and customer support follow-up.

## Operational limits

There is no scheduled worker in this change. A failed/transient event can be retried by Razorpay; expired processing leases can be claimed on a later delivery. Staff can retry a known checkout through the reconciliation endpoint. Monitor recovery records and do not delete them before resolving the payment. A refund, if appropriate, must be reviewed and performed through the established manual process; automated refunds are intentionally absent.
