# PREHERITAGE Customer Features Audit

## Scope and verification limits

### Current development scope

- **OTP login implementation is explicitly excluded.** The existing OTP code/UI state is recorded for audit context only; no new OTP sign-in, resend, or related authentication flow is planned in this work.
- **Razorpay/payment development is explicitly excluded.** Preserve the current Razorpay implementation and payment safeguards. Do not change payment code or add planned Razorpay features unless the user approves a specific change.
- Continue first with authenticated customer password change, authentication/session security, protected routes, and customer data isolation. Then work through the remaining customer features in sections B–F, fixing verified defects within existing architecture.
- No schema change is included in this scope. Global revocation of JWT sessions after a password change remains a documented gap because the current JWT strategy has no per-user token version/revocation field.

This audit combines source inspection, unit tests, and selected local integration tests; it is not a claim that all features work end to end. The application database variables point to remote targets and were not used. The test variables in `.env.test.local` were checked without printing credentials: they identify the matching loopback `preheritage_razorpay_it_` database, and integration tests verified the connected database name before fixture operations. No remote or production database was used. No provider flows were invoked and no real payment or message data was used.

Status meanings: **PASS** means the code path and relevant local test coverage support the behavior; it does not imply a live provider test. **PARTIAL** means code exists but a stated gap or external verification remains. **NOT IMPLEMENTED** means there is no usable customer flow. **BLOCKED** means safe end-to-end verification could not be performed.

## Baseline findings

### A. Account and login

| Feature | Status | Evidence and limits |
|---|---|---|
| Create account | PARTIAL | `src/app/(auth)/register/page.tsx`, `src/app/api/auth/register/route.ts` hash and validate customer registrations. Database persistence and auto-login were not exercised. |
| Email/password login | PARTIAL | `src/lib/auth.ts` checks active users and bcrypt hashes. No credentials or isolated database were available for a live login test. |
| Continue with Google | BLOCKED | Provider is registered only when Google credentials exist; `signIn` accepts only verified, active existing customer accounts. Provider credentials were absent. |
| Mobile number + OTP login | OUT OF SCOPE | Explicitly excluded from implementation scope. Existing OTP path is not being expanded or changed. |
| OTP resend timer and limits | OUT OF SCOPE | Explicitly excluded from implementation scope; no UI or SMS verification was attempted. |
| Edit profile | PARTIAL | `src/components/account/AccountSettings.tsx`, `src/app/api/account/profile/route.ts` provide validation and uniqueness checks. Persistence was not tested against a disposable DB. |
| Change password | PASS (code/tests) | `src/components/account/AccountSettings.tsx` and `src/app/api/account/password/route.ts` require current-password verification, enforce the shared 12–72 UTF-8-byte bcrypt-safe policy, compare the stored hash again in the guarded update to avoid overwriting a concurrent password change, and sign out this browser after success. Policy tests cover byte boundaries; DB persistence was not tested. |
| Logout and session invalidation | PARTIAL | Customer UI uses NextAuth sign-out; password change and password reset sign out the current browser. JWT sessions have a 30-day max age and no per-user revocation marker, so other issued JWTs cannot be invalidated without a schema-backed session version. |
| Protected customer routes / cross-account access | PASS (code/tests) | `src/lib/account-auth.ts` resolves the current active customer from the session on protected page/API access; ownership-scoped APIs and route/address/order tests cover denial paths. No browser session test was possible. |

### B. Addresses

| Feature | Status | Evidence and limits |
|---|---|---|
| Add, edit, delete, set default | PASS (code/tests) | `src/components/account/AccountSettings.tsx`, address routes, and `src/lib/address-management.test.mjs`; ownership and default selection are covered by tests. No persistent DB run. |
| Validate PIN, city, state, full address | PARTIAL | API validates six-digit PIN and bounded required address fields; city/state are required text but not verified against a postal directory. |
| Prevent cross-account access | PASS (code/tests) | Address lookup/update/delete use both address ID and authenticated user ID; ownership tests cover foreign access. |

### C. Shopping

| Feature | Status | Evidence and limits |
|---|---|---|
| Product search and suggestions | PARTIAL | `src/app/shop/ShopClient.tsx` searches loaded products client-side; no suggestion/autocomplete service was found. |
| Category and price filters | PASS (code inspection) | Shop client has category and price-range filters. No browser interaction test. |
| Size and colour filters | PASS (code inspection) | Shop client derives sizes and exposes variant filters; options depend on loaded active catalog. |
| Fabric and region filters | PASS (code inspection) | Region filtering uses existing region records; the catalog now includes a fabric-details text filter using the existing `fabricDetails` field, on desktop and in the mobile filter panel. No browser interaction test. |
| Availability filter and sorting | PASS (code/tests) | The shop now filters in-stock/out-of-stock client-side with `getSellableStock` from `src/lib/inventory.ts`, matching variant aggregate, active-status, and product-stock rules used by catalog and purchase flows. Availability composes with existing filters and sorting; focused helper tests cover products, variants, combined filters, defaults/reset, and empty results. No browser interaction test. |
| Product detail images and zoom | PARTIAL | Product detail loads images and the global CSS supports hover zoom; no browser/device verification. |
| Size, colour, quantity selection | PASS (code inspection/tests) | Product selection and cart model validate variants/stock; `src/lib/cart-model.test.mjs` covers variant and quantity behavior. |
| Add to cart and Buy Now | PARTIAL | Add-to-cart exists. No distinct Buy Now flow was found. |
| Wishlist persistence | PARTIAL | `src/context/WishlistContext.tsx` uses account API for signed-in users and local storage for guests. Cart-to-wishlist previously searched `SAMPLE_PRODUCTS` and removed the line even on a missing match. **Fixed:** it now loads the active catalog product and only removes the line after wishlist save succeeds. |
| Accurate stock availability | PASS (code/tests) | `src/lib/inventory.ts`, cart model, cart API, checkout recompute active product/variant stock; unit tests cover inventory and checkout safeguards. Live concurrent DB behavior remains untested. |
| Related products | PARTIAL | Product detail has related-item presentation based on available catalog data; no end-to-end recommendation verification. |
| Reviews and ratings | PASS (code inspection) | Review route requires an active product, delivered purchase, valid rating/comment, uniqueness, and queues as `PENDING`; public catalog uses approved reviews only. No DB/browser review submission was run. |

### D. Cart and checkout

| Feature | Status | Evidence and limits |
|---|---|---|
| Quantity update/remove | PASS (code/tests) | Cart context and `/api/account/cart` enforce quantities and current stock. Signed-in quantity changes now commit locally only after the owner-scoped PATCH succeeds; stock/network errors are surfaced in the cart and drawer. Unit tests cover cart normalization and persistence-result handling; account DB persistence remains untested. |
| Save for later | PARTIAL | Implemented in client context/local storage, but there is no database model/API for durable account save-for-later. |
| Apply/remove coupons | PASS (code/tests) | `/api/coupons/validate`, coupon service and cart context revalidate against server data; coupon unit tests cover eligibility/discount behavior. |
| Shipping calculation | PASS (code/tests) | `src/lib/cart-model.ts` shared calculations and tests cover standard/express thresholds; server recalculates. |
| Order summary, discount, tax, total | PASS for COD price confirmation (code/tests); tax PARTIAL | Server recomputes prices, coupon, shipping, gift wrap, COD fee; changed item prices or any pricing component pauses COD order creation for customer review, then is recalculated on confirmation. Tax is explicitly zero because product prices are treated as tax-inclusive; no independent tax calculation. Razorpay pre-payment price confirmation remains outside scope because it requires changing provider checkout flow. |
| Guest checkout | PARTIAL | Checkout API accepts guest details. Payment/order persistence was not run because no disposable DB or provider sandbox was configured. |
| Saved address selection | PASS (code inspection/tests) | Checkout loads current account profile/addresses and `selectCheckoutAddress` selects requested/default/first; address helper has tests. |
| Existing Razorpay creation and signature verification | PRESERVED / OUT OF SCOPE | Existing server-side pricing and payment safeguards are retained. No payment code change or live provider test is in scope; any future modification requires specific user approval. |
| COD eligibility and order creation | PARTIAL | Checkout validates server pricing and caps COD orders at ₹25,000; persistence requires a database integration run. |
| Payment success/failure/cancellation/webhook recovery | PARTIAL | Browser callback, webhook recovery, and integrity helpers have mocked unit tests. Real provider events were not sent. |
| Idempotency / duplicate-order prevention | PASS (unit/code) | Checkout idempotency fingerprint and replay/conflict logic have unit coverage. DB race behavior is covered by guarded integration tests but not run. |
| Concurrent stock/coupon consistency | PARTIAL | Transactional conditional stock updates and advisory-lock coupon/order rules exist. COD now reports guarded stock/price conflicts safely and requires fresh price confirmation; integration tests require the missing confirmed loopback test database. |
| Reject client prices/discounts/status/totals | PASS (code inspection/tests) | Checkout routes normalize item IDs/quantities and recompute prices/discounts/fees server-side; payment verification is server-authoritative. |

### E. Orders

| Feature | Status | Evidence and limits |
|---|---|---|
| My Orders page | PASS (code/tests) | `/account/orders` queries orders scoped to the authenticated user, and nested return requests are scoped to that same user. Query failure now resolves to the existing account-unavailable state. Owner scoping and failure handling have focused tests; no database/browser session test. |
| Product/variant/quantity/price/total details | PARTIAL | Order page renders item snapshots and grand total; detailed subtotal, discount, shipping, tax breakdown is available in invoice but not in order summary. |
| Status timeline and cancelled/refunded states | PARTIAL | Canonical progress steps and persisted timeline are shown; cancelled/refunded are not steps in `ORDER_TIMELINE_STEPS` and appear only as status text. |
| Courier, tracking ID, Track Parcel | PARTIAL | Tracking ID is shown and an external link is rendered only when stored `trackingUrl` and ID exist. URL correctness depends on operator data. |
| Cancellation before shipment | PASS (code/tests) | `src/lib/customer-order-actions.ts` scopes reads and conditional updates to the authenticated customer, permits only PLACED/CONFIRMED/PACKED with PENDING/FAILED payment, and transactionally updates status, restocks inventory, and writes a timeline. Focused tests cover unauthorized/foreign access, paid/dispatched/ineligible orders, successful cancellation, repeated attempts, and compare-and-set races. The API maps outcomes to actionable customer messages. No browser test. |
| Return/exchange eligibility and submission | PASS for request/review steps (unit + local integration) | Only delivered owned orders qualify; item IDs must belong to that order; validated requests serialize under an order row lock and reject an existing active request. Staff review is now exposed at `/admin/returns` and `/api/admin/returns` behind `returns.manage`. Staff can approve/reject a request and record item receipt; customer order history remains owner-scoped and displays the persisted status on subsequent page loads. Unit tests cover authorization, data minimization, valid/invalid transitions, compare-and-set conflicts, and audit outcomes. A safe local integration case verifies listing a real submitted request, persisted approval, audit event, and stale-update rejection. |
| Return-request data exposure | FIXED (code/test) | Customer order history previously loaded every scalar field of owner-scoped return requests, including staff `adminNotes` and internal `pickupDate`. The nested query now selects only ID, reason, customer explanation, status, and creation date. A focused query-shape regression test verifies internal fields are excluded. |
| Refund status | PARTIAL / NOT VERIFIED | No customer-facing endpoint changes refund records or payment/order refund status. The general order editor rejects `REFUNDED`; the payment reconciliation endpoint handles captured checkout recovery, not refunds. No refund execution/status workflow was found. COD bank-transfer claims in the return policy are not backed by a verified application workflow. No payment-provider code was changed. |
| Invoice download | PASS (code inspection/tests) | Owned order lookup and escaped printable invoice HTML are implemented and unit-tested; DB/browser download untested. |
| Reorder | PASS (code/tests) | Service checks ownership, active product, variant, current stock/price, and updates account cart; unit tests cover the logic. No persistent DB run. |
| Review only delivered products | PASS (code inspection) | Review API enforces delivered purchase and pending moderation. |

### F. Notifications and support

| Feature | Status | Evidence and limits |
|---|---|---|
| Order confirmation/shipping/delivery email/SMS | PARTIAL | Resend email notifications are implemented for order states; no order SMS sender is wired. Resend credentials absent; only mocked notification tests can run. |
| Refund notifications | NOT IMPLEMENTED | No refund-specific customer notification event/provider flow found. |
| WhatsApp support button/destination | PARTIAL | Number is fetched from server config, normalized, and safely URL-encoded; actual destination is unavailable unless `WHATSAPP_SUPPORT_NUMBER` is configured. No message was sent. |
| Contact form / general inquiry | PASS for submission validation (unit/integration); PARTIAL for support lifecycle | Request-level tests cover accepted persistence payload, required/malformed/oversized fields, honeypot, five-per-ten-minute rate behavior, rate reset, and safe 503 on persistence failure. A disposable local integration test confirms DB persistence and that client-supplied `userId`, `category`, `status`, `orderId`, and `adminNotes` are ignored. Admin inquiry reads/mutations use `inquiries.general.manage` and the mutation audit wrapper. The per-process limiter is best-effort, not distributed; no messaging service is involved. |
| Customer inquiry status visibility | PASS (code/tests) | Signed-in customers now have `/account/inquiries`, which reads only GENERAL tickets with the current customer `userId`, selecting subject/status/dates only. Query tests verify ownership filter, minimal projection, and storage-failure handling; the local integration test confirms another customer’s ticket is excluded. Guest inquiries remain available to admins but are not exposed through account status. There is no customer reply/thread view because `SupportMessage` is not connected. |
| FAQ and navigation | PASS (code inspection) | Static `/faq` page and links exist; browser navigation and the factual accuracy of policy claims were not independently verified. |
| Return/refund request form | PARTIAL | Customer return/exchange form submits for review and status is displayed from owned order history. Staff can progress requests through the bounded review workflow documented above. It does not initiate a refund; no verified refund-processing workflow exists. |

### Returns, cancellation, refunds, and support audit

Cancellation authorization and race handling are already covered in `src/lib/customer-order-actions.test.mjs` and `src/lib/order-status.test.mjs`: customer IDs are part of both initial read and conditional write; only eligible pre-dispatch unpaid/failed orders cancel; status/payment changes lose the conditional update; a successful transaction restocks variants/products and writes one timeline record. The cancellation route returns distinct 401, 404, 409, and 503 messages, with success only after commit. Repeated cancellation is rejected as ineligible after the first commit.

Return requests are restricted to delivered orders, selected order-item IDs, and the signed-in owner. An order-row lock serializes duplicate active requests. Customer history filters nested requests by `userId`. The history query had nevertheless selected all fields on those owned request rows, placing internal staff notes and pickup scheduling data into the customer page payload. It now uses an explicit customer-safe projection; focused unit coverage checks the exact selected fields.

Unresolved workflow gaps: return review now progresses only through the decision and received-item stages listed in the matrix. There is still no refund execution or staff refund-processing workflow; the order editor explicitly refuses to mark an order refunded, while the reconciliation endpoint is for captured Razorpay checkout recovery. Implementing or verifying refunds would cross the payment boundary and remains out of scope. The return policy describes Razorpay refunds and COD bank transfers that are not supported by a verified application flow. The policy/implementation mismatch remains unresolved.

### Staff return transition matrix (constrained to existing enum)

| Current status | Allowed staff transition(s) | Rationale |
|---|---|---|
| `REQUESTED` | `APPROVED`, `REJECTED` | Record the review decision. |
| `APPROVED` | `ITEM_RECEIVED` | Record receipt of the returned item. |
| `REJECTED` | none | Terminal review decision. |
| `ITEM_RECEIVED` | none in this workflow | Further progression would require a verified refund/fulfillment workflow. |
| `REFUND_INITIATED`, `COMPLETED` | none in this workflow | Existing schema values are not permission to initiate or complete refunds. |

Updates must compare the submitted expected status with the persisted status atomically. This prevents an old staff view from overwriting another staff action. Customer-facing history continues to select return requests only through the authenticated customer's own order and `userId`.

### Staff return review implementation evidence

`src/app/admin/(protected)/returns/page.tsx` requires `returns.manage`; `src/app/api/admin/returns/route.ts` applies the same capability to reads and writes. The list projection contains the order reference, return reason/type/explanation, requested order lines, submission time, and current status only; it excludes customer identity, addresses, payment details, `adminNotes`, and `pickupDate`. Mutations accept only request ID, expected status, and next status. `updateMany` uses both ID and expected status as its compare-and-set condition, returning 409 when another update won. Successful status updates use the shared durable admin audit wrapper; audit creation failure blocks the mutation.

The implementation uses existing enum values only: `REQUESTED → APPROVED | REJECTED`; `APPROVED → ITEM_RECEIVED`; no outgoing transitions from `REJECTED`, `ITEM_RECEIVED`, `REFUND_INITIATED`, or `COMPLETED`. The staff UI intentionally has no refund action. Customer order history already projects `id`, reason, customer explanation, status, and date from requests filtered by the authenticated `userId`; account status is available after the customer loads or refreshes order history. No schema, migration, payment-provider, or refund-status changes were made.

General contact messages are stored as GENERAL support tickets and managed through capability-protected admin inquiry endpoints. Customer status visibility now uses the existing `SupportTicket.userId` and status fields, with owner-scoped server-side querying and a minimal customer projection. The customer still cannot reply or view a thread because `SupportMessage` has no connected route/UI. The contact endpoint has strict field validation, a honeypot, safe error responses, and a five-per-ten-minute per-process rate guard; this is best-effort and not a distributed abuse control. The FAQ is static. The inquiry handler was tested with mocked persistence and one disposable-local-DB case verified actual ticket persistence/ownership; no browser workflow, WhatsApp delivery, or actual return/refund fulfillment was verified.

### Focused browser QA and final classification (2026-10-30)

| Classification | Items and evidence |
|---|---|
| Implemented and tested | Return-request authorization, transition validation, compare-and-set stale-update rejection, minimal response projection, audit logging, and customer owner-scoped status query have unit coverage. Two safe integration cases against the confirmed local disposable database passed: customer cancellation/return ownership and staff listing/status persistence/audit/stale rejection. Other automated evidence is listed in sections Aâ€“F. |
| NOT VERIFIED in browser | No reproducible browser-session evidence is retained for `/admin/returns`, customer order/return rendering, account/auth flows, shop filters, checkout UI, or provider-facing integrations. These UI claims require a safe local browser session and remain unverified. |
| Not implemented / out of scope | OTP login; global revocation of other JWT sessions; SMS order notifications; customer inquiry replies/threads; distributed inquiry rate limiting; refund initiation/execution/status completion and refund notifications; COD bank-transfer processing; Razorpay pre-payment price-change confirmation. OTP and provider changes remain excluded; refund behavior remains expressly unimplemented. The published return policy still promises Razorpay refunds and COD bank transfers without a verified application workflow. |

No reproducible browser observation is retained for the admin empty state. The app's `.env.local` database target is non-loopback, so a normal browser session must not be used for data-bearing checks. The existing integration fixture in `test/integration/checkout-and-cancellation.integration.test.mjs` creates a controlled customer, delivered order, and item against the verified disposable loopback database, submits a return through `createCustomerOrderActions`, exercises the staff handler, and cleans up fixture-owned records. This verifies the service/API path, not rendering in a browser.

Unit tests verify the transition matrix, authorization denial for roles without `returns.manage`, and stale updates. The local integration test verifies a submitted request can be listed, `REQUESTED → APPROVED` persists, and a stale `REQUESTED → REJECTED` attempt gets 409. This QA pass did not browser-test `REQUESTED → REJECTED` or `APPROVED → ITEM_RECEIVED`, did not exercise browser-visible success/error states, and did not test customer order display or cross-customer data isolation in a browser. Existing customer query tests verify owner filters; they are not a browser session test. The remote-configured dev app cannot safely be used for those data-bearing browser checks. No source fix was made. Browser console/network review and responsive checks remain outstanding.

## Fixes applied

### Password policy and session handling

Review found inconsistent password limits: registration accepted 8 characters, while reset/change allowed up to 200 characters, despite bcrypt only using at most 72 UTF-8 bytes. This could make longer passwords behave unexpectedly and produce different limits between account flows. A shared 12–72 UTF-8-byte policy now applies to registration, password reset, and authenticated password change, with focused boundary tests. The authenticated password update compares the observed hash again in its role/active guarded write, preventing a concurrent password change or account deactivation from being overwritten. Malformed JSON is treated as a client validation error; other failures return a generic service error. Password change and reset attempt to sign out the current browser; global revocation of other JWT sessions remains unavailable without schema support.

### Mobile catalog filters and fabric search

The shop had a mobile filter button that only opened a state flag; there was no mobile panel, and no dedicated fabric filter despite the existing `fabricDetails` field. The button now opens a responsive filter panel for category, region, fabric text, price, size, and colour. Fabric matching uses the stored editorial details and invents no product attributes.

### Product availability filter

The catalog already represents product-level stock and computes variant-aware sellable stock with `getSellableStock`. A client-side availability filter now uses that same helper and offers All, In stock, and Out of stock controls in both desktop and mobile interfaces. It composes with fabric/search/other filters and sorting, resets to All with Clear filters, and makes no additional API request.

### Cart item to wishlist

Baseline inspection found `src/app/cart/page.tsx` looked up the cart line in `SAMPLE_PRODUCTS` before adding it to wishlist, and removed it from cart even when no match existed. Database-backed cart products are not guaranteed to have sample IDs. This could silently discard the cart item without persisting a wishlist entry.

The repair adds a public active-product lookup at `src/app/api/products/[productId]/route.ts`, uses it from `src/lib/cart-wishlist.ts`, and waits for account wishlist persistence before removing the cart line. Failed lookups or writes leave the cart intact. `src/lib/cart-wishlist.test.mjs` covers successful ordering, unavailable/mismatched products, failed saves, and network failures.

### Cart quantity consistency and order-history failure handling

Inspection found the signed-in cart updated its displayed quantity optimistically and discarded the `/api/account/cart` PATCH result. A server-side stock rejection or network failure could therefore leave the displayed quantity out of sync with the persisted cart. The account flow now waits for server acceptance, prevents overlapping quantity writes for the same item, and reports failures without clearing the coupon or claiming success. The API's insufficient-stock response tells the customer to refresh the bag. Guest cart behavior remains local; checkout continues to revalidate current product/variant stock and authoritative prices.

Order history already filtered orders by the authenticated user, but a database read exception escaped the page path. The query now has an explicit owner-scoped helper and reports the existing account-unavailable state on failure. Tests cover owner filters (including nested return requests) and database failure handling.

### COD checkout price and stock conflicts

The shared route previously converted a failed conditional stock decrement into its generic 500 path, while preflight stock conflicts did not consistently explain the item or next step. A typed transactional stock conflict now rolls back the transaction and returns HTTP 409 with an item-specific, customer-safe instruction. Preflight also detects inactive/missing products, missing variants, and insufficient variant/product stock. The conditional decrement still guards current stock and active product state; cart updates do not reserve stock.

The route previously recalculated price, coupon discount, shipping, gift wrap, and COD fee server-side but proceeded with a changed total without asking the customer to review it. COD requests now compare current database-derived item prices, quantities, and the full amount breakdown with the checkout's submitted expectations. A mismatch returns a structured `PRICE_CHANGED` 409 containing the authoritative quote and a signed HMAC confirmation token. The token expires after 15 minutes and binds the quote to product/variant IDs, quantities, unit prices, subtotal, discounts, charges, total, coupon, delivery method, full delivery/customer details, and the checkout idempotency key. The UI displays the updated order summary and requires a separate customer submit to confirm. The server recalculates everything again; changed or expired tokens return the latest quote instead of creating an order. A last-moment item price change detected by the guarded transaction aborts the transaction and asks the customer to review again.

Replay review: a token can be presented again with its original key during its validity window, but a successful prior order is returned by the existing idempotency replay path before new inventory/order writes. The unique checkout key also resolves simultaneous duplicate submissions to the one committed order. The token cannot be transferred to a different checkout key. There is no separate database record marking a quote token consumed; duplicate prevention relies on the existing checkout idempotency key and unique constraint. Repeated price changes require a new quote token and customer submission each time; no automatic retry loop exists.

Stock update review: product decrements require the product to remain active, its price to match the verified value, and stock to cover the quantity. Variant decrements also guard variant price/stock and parent product active status/base price. A typed conflict thrown inside the Prisma interactive transaction aborts the callback. A new local integration case makes a competing write exhaust the second product after the first item decrement and coupon usage update have run. The route returns HTTP 409 `STOCK_CONFLICT`; the transaction leaves no order, items, timeline, payment, first-item decrement, or coupon usage increment. The competing write that set the second product stock to zero remains, as expected. Existing cases also verify same-key duplicate rollback and prevent overselling the final unit.

Checkout route integration: tests call the actual `POST` handler and check HTTP status and response JSON. They cover a valid confirmation token, an expired token, changes to cart, customer details, coupon, delivery method, and idempotency key, a database price change that invalidates a token and requires another explicit submit, and same-key replay returning the original order without another stock decrement. Route Prisma is bound to the verified test URL before import and checked with `current_database()`; guest authentication and email delivery are stubbed/disabled. The token-change cases keep the same idempotency key except the key-binding case, so each changed context is independently rejected by route confirmation validation.

This confirmation currently applies to COD only. The Razorpay branch returns through its existing captured-payment callback before this COD confirmation logic; adding pre-payment repricing there would require changing the provider checkout flow, which remains explicitly out of scope. No Razorpay callback, verification, capture, refund, or provider configuration code was changed. Existing COD idempotency and payment compatibility unit coverage remains in place. The checkout integration suite uses only the verified loopback disposable database; external payment behavior and real browser behavior were not exercised.

## Verification results

Test database selection was verified without printing credentials: the test URL resolves to PostgreSQL on loopback, its database name has the required `preheritage_razorpay_it_` prefix, and `CONFIRM_TEST_DATABASE_NAME` matched exactly. The test and checkout-route Prisma clients verified `current_database()` against that name before fixture operations. From the prior checkout verification, `test/integration/checkout-and-cancellation.integration.test.mjs` passed 11/11. In this final QA pass, the targeted cancellation/return ownership and staff-review persistence integration cases passed 2/2 against the same disposable local DB. `npm.cmd run test:unit`: PASS, 190/190. `npx.cmd tsc --noEmit`: PASS. `git diff --check`: PASS (Git emitted LF/CRLF conversion warnings only). No production or remote database was used. The local integration case verifies a real submitted return request is listed with minimal data, staff approval persists, an audit event is created, and a stale update returns 409. Browser verification reached only the unauthenticated admin redirect; authenticated feature workflows, responsive states, console/network errors, and refunds were not tested. The in-memory inquiry rate guard remains process-local. The subsequent verified production build passed as recorded below.

### Production build verification and release-readiness follow-up (2026-10-30)

- `npm.cmd run build` — **PASS**. The command completed successfully: Prisma Client **5.22.0** generated successfully; Next.js **14.2.35** compiled successfully; linting and type validation passed; static page generation completed **71/71**; and build tracing and optimization completed.
- This build result supersedes the earlier blocked-build note. It records the user-verified command result only; no migration, seed, remote database access, deployment, or push is implied by it.
- Read-only process inspection found eight active `node.exe` processes. The Prisma client directory also contains the generated Windows query-engine DLL and multiple `.tmp` engine copies. Windows process-command-line inspection was denied by the environment, so it was not possible to establish which processes own or use those files. No process was stopped, and no generated artifact was deleted or replaced.
- This evidence is consistent with a possible Windows file-lock or overlapping-generation cause for the earlier `EPERM`, but does not prove the exact original cause. The subsequently verified successful Prisma generation and production build show that the failure was not persistent at build time; the original cause remains unconfirmed.
- Additional read-only inspection on 2026-10-30 used `Get-Process` and its module list: eight Node processes were active, and one process had `query_engine-windows.dll.node` loaded. Seven readable Node module lists did not show that engine. The client directory held 37 engine-named files (the main DLL and 36 `.tmp` copies). This confirms an engine is loaded in a live process now, but does not identify that process's owning application or establish what caused the earlier `EPERM`; command-line inspection was denied. No process was stopped and no engine file was changed.
- The process investigation did not delete or replace any Prisma engine artifact. The verified build result above is the current generation/build status; any future process investigation must continue to identify and gracefully close only Node processes explicitly recognized as PREHERITAGE work.
- No database connection, migration, seed, schema edit, or application-code edit was made for this follow-up. Existing test/typecheck results above remain the reported results; this follow-up only adds the current generation/build diagnosis.
- A later focused return-management pass used only `.env.test.local` after checking in-process that `TEST_DATABASE_URL` resolves to loopback, the database name has the required `preheritage_razorpay_it_` prefix, and `CONFIRM_TEST_DATABASE_NAME` exactly matches. The integration harness independently rechecked the connected database identity before fixtures and cleanup.
- Focused disposable-database integration command: `node --import ./scripts/register-test-loader.mjs --test --test-name-pattern='customer cancellation and return requests|staff return review persists|customer order history exposes return status' test/integration/checkout-and-cancellation.integration.test.mjs` — **PASS, 3/3**. It exercised submitted return ownership/item validation; persisted `REQUESTED → APPROVED`, `REQUESTED → REJECTED`, and `APPROVED → ITEM_RECEIVED`; stale-update rejection; and owner-scoped order history containing only that customer's return statuses. No production or remote database was contacted.
- Focused unit command: `node --import ./scripts/register-test-loader.mjs --test src/lib/admin-return-requests.test.mjs src/lib/customer-order-history.test.mjs` — **PASS, 9/9**. This includes `returns.manage` authorization denial before database access and the transition matrix. The authorization test uses the existing helper/test fixture; it does not authenticate a real browser account.
- `git diff --check` — **PASS**, with existing LF/CRLF warnings. A direct whitespace scan of the two files touched in this pass was clean.
- These results cover database persistence and helper-level ownership, not authenticated browser behavior. A signed-in staff account without `returns.manage`, visible success/error states, and cross-customer browser isolation remain **NOT VERIFIED**. No browser credentials were used and no authentication was bypassed.

### Remaining browser QA review

| Item | Status | Evidence and required safe verification |
|---|---|---|
| Populated return review | NOT VERIFIED | Source and disposable-DB integration coverage establish that a submitted request can be listed and transitioned through `REQUESTED → APPROVED`, `REQUESTED → REJECTED`, and `APPROVED → ITEM_RECEIVED`. The observed browser page contained only the empty state. Verify a populated list, request dialog, and visible post-action feedback only after the browser app is configured to the verified disposable loopback database. |
| Staff denial without `returns.manage` | NOT VERIFIED | `admin-return-requests.test.mjs` covers denial before database access, and the page/API require the capability. An authenticated browser session for a role without that capability has not been exercised. |
| Customer cross-account isolation | NOT VERIFIED | Owner-scoped service and disposable-DB integration tests show each customer's order history and return requests exclude the other customer's records. Two authenticated browser sessions and direct foreign-order URL/API attempts have not been exercised. |
| Responsive, loading, empty, and error states | NOT VERIFIED | The returns dashboard has explicit loading, empty, error, refresh, and responsive dialog/table markup, but no state or viewport was browser-observed in this audit. |
| Browser console and network errors | NOT VERIFIED | No safe authenticated, data-bearing browser workflow was run against the disposable database, so there is no browser console/network capture for the populated return workflow. |

Refund processing remains unresolved. The published return policy still describes Razorpay refunds and COD bank transfers without a verified application workflow; that policy/implementation mismatch remains unresolved.

### Final release checklist (2026-10-30)

| Status | Release item | Evidence or release condition |
|---|---|---|
| PASS | Production build | `npm.cmd run build` completed successfully: Prisma Client 5.22.0 generation, Next.js 14.2.35 compilation, linting/type validation, static generation 71/71, build tracing, and optimization all completed. |
| PASS | Return-request service controls | Disposable-loopback integration and focused unit tests cover owner scoping, staff capability enforcement, allowed transitions, stale-update rejection, and audit persistence. |
| FAIL | Refund processing and published-policy alignment | No verified refund execution/status workflow exists, while the published policy promises Razorpay refunds and COD bank transfers. This mismatch remains unresolved. |
| NOT VERIFIED | Populated staff return review in a browser | Requires a browser app safely configured to the verified disposable loopback database. |
| NOT VERIFIED | Browser denial for a staff role without `returns.manage` | Unit authorization coverage exists; an authenticated browser role test does not. |
| NOT VERIFIED | Browser cross-account isolation | Service/integration ownership coverage exists; two-session browser verification does not. |
| NOT VERIFIED | Responsive, loading, empty, and error states | Populated, loading/error, viewport, empty, and customer-order browser states remain outstanding. |
| NOT VERIFIED | Browser console and network behavior | No safe data-bearing browser workflow has produced a console/network capture. |

### Final non-payment QA execution (2026-10-30)

The following checks were run without the schema preparer, migrations, seed scripts, or application database variables. The integration command loaded only `.env.test.local`; before fixtures it required a PostgreSQL loopback target, a `preheritage_razorpay_it_` database name, and an exact `CONFIRM_TEST_DATABASE_NAME`, then checked `current_database()` through both direct and route Prisma clients. Fixture cleanup repeats that identity check. No remote database was contacted.

| Status | Check | Exact evidence |
|---|---|---|
| PASS | Disposable return review API path | `node --env-file=.env.test.local --import ./scripts/register-test-loader.mjs --test --test-name-pattern="customer cancellation and return requests|staff return review persists|customer order history exposes return status" test/integration/checkout-and-cancellation.integration.test.mjs` — **PASS, 3/3**. The authorized handler listed a fixture-created request, persisted `REQUESTED → APPROVED`, `REQUESTED → REJECTED`, and `APPROVED → ITEM_RECEIVED`, and returned 409 for a stale `REQUESTED → REJECTED` attempt after approval without changing the newer status. |
| PASS | Staff authorization before return-data access | `node --import ./scripts/register-test-loader.mjs --test src/lib/admin-return-requests.test.mjs src/lib/customer-order-history.test.mjs src/lib/customer-order-actions.test.mjs` — **PASS, 18/18**. `PRODUCT_MANAGER` and `CONTENT_MANAGER` received 403 for both list and mutation, an unauthenticated mutation received 401, and the permission test asserted zero database and audit calls before denial. |
| PASS | Customer isolation and foreign-ID handling | The same commands verify two disposable customers each receive only their own orders and nested return requests; foreign customer return/cancellation requests return safe `not-found` results, and a foreign order item is rejected as `invalid-items`. |
| NOT VERIFIED | Authorized admin empty-state render | No reproducible, safe local browser session is available for this audit. The empty state has not been browser-verified. |
| NOT VERIFIED | Populated return review in a browser | The integration test proves the server/API list includes a submitted fixture request; it did not render the populated dashboard in a browser. The browser automation host was unavailable for this QA pass. |
| NOT VERIFIED | Browser loading, error, and mutation feedback | The dashboard has explicit loading, error, success-notice, refresh, and stale-update error paths, but no browser interaction was available to observe them. |
| NOT VERIFIED | Responsive customer/admin pages, console, and network | Desktop/mobile viewport checks, customer return rendering, console errors, and failed network requests could not be captured because no browser surface was available. No browser result is inferred from source inspection or automated tests. |
| FAIL | Refund processing and published-policy alignment | This remains unresolved: no verified refund execution/status workflow exists, while the published policy promises Razorpay refunds and COD bank transfers. |

The test processes emitted Node's `MODULE_TYPELESS_PACKAGE_JSON` performance warning for TypeScript modules parsed as ES modules. It did not fail a test and is not a returns behavior failure. No source change was made in this QA execution.

### Final browser UI QA (2026-10-30)

Preparation was read-only. The worktree remained dirty with its pre-existing modified and untracked files. No local development server was listening on ports 3000–3005; the visible Node processes were Codex runtimes, not a recognized PREHERITAGE server. `.env.local` resolves `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to Neon hosts, so no server was started against it. The browser/native-app inventory returned no usable surfaces: the browser access host and native pipe were unavailable. No saved credentials were used, authentication was not bypassed, and no browser route was opened.

| Status | Route / viewport | Actual observed result |
|---|---|---|
| NOT VERIFIED | `/admin/returns` / desktop | No local PREHERITAGE server or browser surface was available. Authorized dashboard rendering, populated-table presentation, transitions, stale-conflict feedback, loading, empty, and error states were not browser-observed. |
| NOT VERIFIED | `/admin/returns` / mobile | No browser viewport was available. Overflow, clipped controls, readable labels, and button usability were not browser-observed. |
| NOT VERIFIED | `/account/orders` and return controls / desktop | No authenticated disposable-test-customer browser session was available. Customer rendering and return-status presentation were not browser-observed. |
| NOT VERIFIED | `/account/orders` and return controls / mobile | No browser viewport or authenticated disposable-test-customer session was available. Responsive behavior was not browser-observed. |
| NOT VERIFIED | Staff without `returns.manage` / any viewport | No authorized disposable staff browser session was available. Browser denial was not observed; the server-side denial remains test-verified in the focused unit suite. |
| NOT VERIFIED | Customer cross-account access / any viewport | No two-customer browser session was available. Browser isolation was not observed; the disposable integration suite remains test-verified. |
| NOT VERIFIED | Console and network / any route | No browser devtools or browser surface was available, so no console messages or failed requests could be captured. |
| PASS (test-verified, not browser-observed) | Return handlers and customer ownership | The final non-payment automated checks immediately above passed: return transitions/stale protection **3/3**, and authorization/ownership tests **18/18**, against the verified disposable loopback database where applicable. |

No browser result above is inferred from source inspection or automated tests. A future browser pass requires a local server explicitly configured for the verified disposable loopback database and authorized disposable test sessions; it must not use `.env.local`'s remote database target.

### Safe local browser-QA environment readiness (2026-10-30)

| Status | Evidence |
|---|---|
| PASS | Read-only target verification using only `.env.test.local` confirmed that `TEST_DATABASE_URL` is loopback-only, its database name begins `preheritage_razorpay_it_`, `CONFIRM_TEST_DATABASE_NAME` matches, and `SELECT current_database()` returned that same confirmed disposable name. No fixture, schema, migration, seed, or cleanup operation was run. |
| PASS | Next’s development environment loader reported only `.env.local` and `.env`; it does not load `.env.test.local` automatically. The effective `DATABASE_URL` and `DATABASE_URL_UNPOOLED` hosts after loading were Neon hosts, so the normal application environment is unsuitable for browser fixtures. No values or credentials were recorded. |
| PASS | Target-path inspection found no database query at Prisma-client construction or Next server startup. `/admin/returns` authorizes the session and reads the current admin on page request, then the client dashboard GET reads return requests after mount; PATCH is reachable only through an explicit user action. `/account/orders` resolves the customer session and reads the user/orders during that route’s server render. These request paths can query the configured database, but the inspected GET/render paths do not create fixtures or mutate return status. |
| NOT VERIFIED | A safe browser server was not started. It would require process-local overrides for both application database variables to the already verified disposable URL, plus an isolated non-secret `NEXTAUTH_SECRET`; otherwise Next would load the Neon values from `.env.local`. No configuration file was changed. |
| NOT VERIFIED | There is no existing browser-capable authorized test-account fixture. The integration harness creates passwordless disposable customers and injects/stubs admin authorization; it cleans its records at test completion. It cannot establish real NextAuth customer/admin browser sessions, including the no-`returns.manage` staff case, without a new retained browser-fixture mechanism. |
| NOT VERIFIED | Browser access remains unavailable: the browser host and native automation pipe exposed no usable surface. Therefore no local route, viewport, console, or network check was run. |

The original fixture-lifecycle blocker is resolved below. The remaining blocker is the absent browser surface: a real browser session must be available before authenticated UI behavior can be verified.

### Isolated browser-QA fixture lifecycle (2026-10-30)

The repository now provides `browser-qa:setup`, `browser-qa:status`, and `browser-qa:cleanup`, backed by `scripts/browser-qa-fixtures.mjs`. Setup accepts only `TEST_DATABASE_URL`, `CONFIRM_TEST_DATABASE_NAME`, and a process-only `BROWSER_QA_PASSWORD`; it does not read application database variables and never writes or prints the password. It requires a loopback PostgreSQL host, a `preheritage_razorpay_it_` database name, exact confirmation, no schema/search-path override, and matching `current_database()` before every fixture lifecycle action.

Setup generates an exact fixture ID and creates two active customer accounts, an active `ORDER_MANAGER` (which has `returns.manage`), an active `PRODUCT_MANAGER` (which does not), a product/category, delivered orders for both customers, and a requested return for the first customer. The accounts use bcrypt hashes and must sign in through the existing `credentials` and `admin-credentials` NextAuth providers; no session or capability is stubbed in the application. The caller retains the supplied password only in its process environment. Cleanup requires the printed fixture ID and deletes only exact-ID records created by this lifecycle, after re-verifying the same target.

| Status | Evidence |
|---|---|
| PASS | `node --test scripts/browser-qa-fixtures.test.mjs` — **PASS, 2/2**: loopback/name/confirmation/search-path guards and fixture-handle/password validation passed. |
| PASS | A disposable setup/status/cleanup lifecycle completed successfully against the verified loopback database. It created the two customer accounts, `ORDER_MANAGER`, `PRODUCT_MANAGER`, delivered orders, and a `REQUESTED` return; status reported both intended roles; cleanup removed the exact fixture records. No credentials were printed. |
| PASS | A Next environment precedence check set both application database URLs from `TEST_DATABASE_URL` and an ephemeral NextAuth secret before invoking the loader. After loading `.env.local` and `.env`, both database hosts remained localhost and the ephemeral secret remained selected. No server was started. |
| NOT VERIFIED | No browser run was performed: the browser host remains unavailable. The fixture mechanism is ready for a real browser session but does not itself prove rendering, login, responsive behavior, console/network status, or authorization UI. |

For a later local browser run, set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` from the already guarded `TEST_DATABASE_URL` in the server process, set a new process-only test `NEXTAUTH_SECRET`, run setup with a process-only password, and use the emitted fixture emails with that password through the normal sign-in forms. Run cleanup with the same fixture ID when the browser run ends. Do not start the server if either effective database host is not loopback.

### Browser execution availability check (2026-10-30)

| Status | Evidence |
|---|---|
| PASS | Chrome and Edge executables are present on the workstation. |
| NOT VERIFIED | The repository has no installed Playwright, Cypress, Puppeteer, Selenium, or WebDriver package/configuration. `package-lock.json` mentions an optional Playwright peer dependency, but no browser-test package is installed in `node_modules` and no runner configuration or end-to-end test file exists. |
| NOT VERIFIED | The supported browser automation inventory exposed no browser or native-app surface. It reported that the native automation pipe could not be connected and that the browser access host was unavailable. |

No browser fixture was created and Next.js was not started for this attempted browser run. The exact missing capability is a usable browser automation host or an existing installed browser-test runner. No dependency or browser download was attempted.

### Final non-browser QA recheck (2026-10-30)

This recheck did not start a Next.js server, create or clean fixtures, or run migrations or seeds. The browser-QA fixture test below exercises only local guard/validation functions; it creates no fixture records and does not open a database connection. The production-build output reports that Next loaded `.env.local` and `.env`; it does not itself establish whether build-time rendering made a database query. The browser-only claims elsewhere in this audit were reviewed for support: prior empty-state browser PASS language was removed because no reproducible safe browser evidence is available.

| Status | Command | Actual result |
|---|---|---|
| PASS | `npm.cmd run test:unit` | Exit 0. **190/190** tests passed; 0 failed. Node emitted `MODULE_TYPELESS_PACKAGE_JSON` performance warnings while parsing TypeScript modules as ES modules. |
| PASS | `npx.cmd tsc --noEmit` | Exit 0 with no diagnostics. |
| PASS | `git diff --check` | Exit 0 with no whitespace errors. Git printed existing LF/CRLF conversion warnings for modified tracked files. |
| PASS | `node --test scripts/browser-qa-fixtures.test.mjs` | Exit 0. **2/2** guard tests passed. No fixture was created and no database connection was attempted. |
| PASS | `npm.cmd run build` | Exit 0. Prisma Client **5.22.0** generated successfully; Next.js **14.2.35** compiled successfully; linting/type validation passed; static generation completed **71/71**; page optimization and build tracing completed. |
| FAIL | Refund processing and published-policy alignment | Still unresolved: no verified refund execution/status workflow exists, while the published return policy promises Razorpay refunds and COD bank transfers. |
| NOT VERIFIED | Browser-only return, authorization, isolation, responsive, console, and network checks | Browser execution is unavailable. No local server was started, and no browser result is inferred from automated checks. |

## Manual browser tests still required

- Account create, sign-in, logout, password change, protected-route redirects, profile/address forms, wishlist, cart, contact submission, and `/account/inquiries` empty/list/status states across signed-in and guest sessions. Verify other issued sessions remain a known revocation limitation.
- Shop filters, product variant selection, image zoom, review submission/moderation visibility, and checkout summary across desktop/mobile.
- COD checkout conflict and confirmation UX in a browser: review a quote after item/coupon/shipping changes, allow another price change before confirming and ensure a new quote is required, test an item becoming unavailable/stock dropping, and complete an unchanged successful COD checkout. Verify one order and one stock decrement when retrying with the same attempt key. Browser behavior was not tested.
- Token expiry in the UI: leave a quote open beyond 15 minutes, confirm, and ensure a fresh quote is returned before order creation. The route integration test verifies HTTP 409 and a fresh quote for an expired token; browser behavior remains untested.
- Razorpay pre-payment price confirmation remains unimplemented because implementing it requires changes to its provider checkout flow; existing Razorpay behavior and code were preserved.
- Order cancellation, invoice rendering/download, tracking destination, delivered-item return/exchange, reorder, and customer status timeline.
- Staff return review in a browser: the authenticated admin shell and `/admin/returns` empty state were observed. Still verify a submitted request appearing in the list, request details, each allowed transition and visible feedback, denial for a signed-in role without `returns.manage`, responsive/loading/error states, and customer-visible status after reloading `/account/orders`. Browser data checks are blocked until the local app is safely bound to the verified disposable DB; the current app DB config is non-loopback.
- Google OAuth, Resend email, WhatsApp destination, and contact-form persistence after test-only credentials/configuration are provided. OTP login implementation is excluded.

## Files changed for this audit

- `docs/customer-feature-audit.md`
- `src/app/api/products/[productId]/route.ts` (new)
- `src/app/cart/page.tsx`
- `src/context/WishlistContext.tsx`
- `src/lib/cart-wishlist.ts` (new)
- `src/lib/cart-wishlist.test.mjs` (new)
- `src/app/api/account/password/route.ts` (new)
- `src/components/account/AccountSettings.tsx` (authenticated password form and current-browser sign-out)
- `src/app/api/auth/register/route.ts` (shared password policy)
- `src/app/reset-password/page.tsx` (shared policy and current-browser sign-out)
- `src/lib/password-reset.ts` (shared password policy)
- `src/lib/customer-password-policy.ts` and `.test.mjs` (new shared policy and focused tests)
- `src/app/shop/ShopClient.tsx` (mobile filter panel and fabric filter)
- `src/lib/catalog-availability.ts` and `.test.mjs` (new availability helper and focused tests)
- `src/lib/cart-quantity-sync.ts` and `.test.mjs` (new account cart persistence result handling and focused tests)
- `src/lib/customer-order-history.ts` and `.test.mjs` (owner-scoped failure handling and customer-safe return-request projection/tests)
- `src/app/api/inquiries/route.ts` and `src/lib/customer-inquiries.ts` (validated, injectable inquiry handler and owner-scoped status query)
- `src/lib/customer-inquiries.test.mjs` (submission validation, rate limit, safe error, untrusted-field, and status-query tests)
- `src/app/(customer)/account/inquiries/page.tsx` and `src/components/account/AccountNav.tsx` (signed-in inquiry status page/navigation)
- `test/integration/checkout-and-cancellation.integration.test.mjs` (disposable local inquiry persistence and ownership test)
- `src/app/api/account/cart/route.ts` (clearer stock-conflict response)
- `src/components/cart/CartDrawer.tsx` (cart synchronization error display)
- `src/app/(customer)/account/orders/page.tsx` (safe order-history unavailable state)
- `src/app/api/checkout/route.ts` (COD item availability, stock/price conflicts, and confirmed server quote)
- `src/app/checkout/page.tsx` (COD updated-summary review and reconfirmation UI)
- `src/lib/checkout-confirmation.ts` and `.test.mjs` (quote comparison, stale confirmation binding, availability and focused tests)
- `src/app/admin/(protected)/returns/page.tsx` and `ReturnRequestsDashboard.tsx` (permission-protected staff list and review UI)
- `src/app/api/admin/returns/route.ts` and `src/lib/admin-return-requests.ts` (capability-protected minimal query, validated transition CAS, audit wrapper)
- `src/lib/admin-return-requests.test.mjs` (authorization, transition, stale update, data minimization, and audit tests)
- `src/components/admin/AdminSidebar.tsx` (Returns navigation entry)
- `src/lib/admin-api-access.ts` (returns endpoint capability mapping)
- `test/integration/checkout-and-cancellation.integration.test.mjs` (local staff return status persistence and audit case)
