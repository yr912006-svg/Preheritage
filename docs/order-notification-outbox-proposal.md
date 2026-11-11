# Order email delivery reliability proposal

The current implementation sends service email after the order or status transaction commits. Conditional status transitions prevent repeat status requests from generating another email attempt, and COD checkout idempotency prevents an identical retry from creating another order or attempting a second confirmation email. Email failures do not change the committed order.

This is best-effort delivery. A process can stop after the database commit but before the Resend request, and a provider can accept a request while the response is lost. The current schema has no durable per-event email claim, retry queue, or delivery record, so it cannot safely recover those cases or guarantee exactly-once delivery.

Before adding automatic retries, propose a database-backed outbox in a separate reviewed migration:

- `OrderEmailOutbox` with a foreign key to `Order`, an event type, status, attempt count, lease token/expiry, safe error code, provider message ID, and timestamps.
- A unique key on `(orderId, eventType)` for one-time order/status events. If the business later permits repeated events of one type, add an explicit transition/event sequence to the key.
- Insert the outbox row in the same transaction as order creation or the conditional status transition.
- A worker claims rows atomically with a lease, sends only from persisted order data, and conditionally records the result using its current lease token.
- Before retrying ambiguous provider responses, verify Resend's idempotency support and its retention semantics. Without provider-side idempotency, the system must choose between possible duplicate email and possible missed email after an ambiguous timeout.

Do not represent an attempted or provider-accepted request as a delivered email. No migration or worker is included in this change.
