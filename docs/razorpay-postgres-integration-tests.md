# Razorpay PostgreSQL integration tests

The integration suite is deliberately separate from `npm run test:unit`. It opens PostgreSQL only from `TEST_DATABASE_URL`, requires a loopback host, the database name prefix `preheritage_razorpay_it_`, and an exact `CONFIRM_TEST_DATABASE_NAME` match. It then checks `current_database()` before running tests. `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are never read by the harness.

## Disposable database setup

Use a local PostgreSQL instance or container and create a new, empty database whose name begins with `preheritage_razorpay_it_`. Do not clone a database containing customer/payment data. The prepare command derives a base schema offline from a temporary copy of the current Prisma schema with only `RazorpayCheckout`, `RazorpayWebhookEvent`, and the inverse `Order.razorpayCheckout` relation removed. It generates the baseline SQL with Prisma 5.22 `migrate diff --from-empty`; it then applies that schema and the reviewed recovery SQL draft in order. It does not use `prisma db push`.

The preparer requires `TEST_DATABASE_URL` and `CONFIRM_TEST_DATABASE_NAME`. It verifies the URL host/name and asks PostgreSQL for `current_database()` before the first DDL statement and immediately before every later DDL statement. Any mismatch fails closed. It prints only the confirmed database name, not credentials. The generated base schema is temporary and contains schema only, never application rows.

The checked-in recovery draft is a delta and cannot initialize an empty database by itself. It includes the nullable unique `claimToken` column and index. The integration tests expect the full PREHERITAGE schema plus this recovery delta.

## Future human-reviewed run

Run from the repository root in PowerShell, using a local disposable database only. Supply the two variables in the current shell session; do not put them in `.env`, `.env.local`, or source control. `TEST_DATABASE_URL` must point to the local database named by the confirmation variable.

```powershell
$env:TEST_DATABASE_URL = 'postgresql://test_user:test_password@127.0.0.1:5432/preheritage_razorpay_it_local'
$env:CONFIRM_TEST_DATABASE_NAME = 'preheritage_razorpay_it_local'
npm run test:integration:prepare
npm run test:integration
```

Preparation changes only that confirmed local database schema. It does not create the database, seed rows, or copy customer/payment records. Review and reset/discard the disposable database between runs. Never use a Neon hostname; the loopback check rejects it.

The integration command runs only `test/integration`. It verifies identity again and creates/cleans up only fixtures identified by its generated IDs. It uses barriers for concurrent delivery/finalization and directly advances lease timestamps for takeover tests; it does not sleep. The assertions cover duplicate/simultaneous events, browser callback races, unique payment IDs, stock and coupon conflicts, rollback after nested order/payment creation, deleted finalized orders, pricing mismatch, expired leases, stale renewal/completion, and recovery by a newer worker.

The test loader uses Node's built-in TypeScript stripping and module hooks to load the existing `.ts` services without adding dependencies. Use Node 26 (the version checked in this workspace); the loader depends on `node:module.registerHooks` and native TypeScript stripping.

## What a pass proves

A passing integration run exercises PostgreSQL's actual unique constraints, advisory locks, conditional stock writes, transaction rollback, and fenced webhook updates in the tested schema/configuration. Unit tests and TypeScript checks do not prove those database concurrency properties. The suite also does not verify Razorpay network behavior or live deployment configuration; provider calls and signatures are mocked.
