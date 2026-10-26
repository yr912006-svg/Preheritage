# PREHERITAGE security fixes and verification status

## Implemented

- Admin sign-in verifies bcrypt hashes against the `Admin` table. Signed NextAuth JWT claims protect every `/admin/*` route except `/admin/login`.
- Removed demo admin/customer credentials and authentication fallbacks. The seed creates an admin only when explicit `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` values are set.
- Registration validates input, hashes passwords with bcrypt cost 12, rejects duplicate email/phone, and returns an error if PostgreSQL persistence fails.
- OTPs use cryptographic generation, SHA-256 hashes at rest, expiry validation, one-time use, and a limit of five sends per phone per hour. Production requires an SMS provider; OTPs are not returned or logged in production.
- Razorpay order creation recalculates product and variant prices, availability, shipping, and gift wrap from PostgreSQL rather than accepting a client amount.
- Checkout revalidates current price and inventory, uses atomic stock decrements, verifies Razorpay signature and gateway order/payment amount/status, and saves order/payment records transactionally.
- Newsletter subscription succeeds only after the subscriber is saved. Stripe checkout does not fake success.

## Remaining limitations

- Admin pages still display static/demo content and this project has no admin mutation APIs. Route authorization is implemented, but operational admin functions are not.
- Coupon validation, account reset/verification, customer order ownership/history, general auth rate limiting, and COD idempotency remain incomplete.
- OTP delivery needs real provider credentials. Local development uses an explicit mock response.
- No database, Razorpay, SMS-provider, or browser integration test was run. Do not switch payments to live mode until the full test-mode journey passes.
- `npm run lint` currently invokes `next lint` without an ESLint dependency or config and prompts for interactive setup.

## Local setup

1. Copy `.env.example` to `.env.local`. Set a PostgreSQL `DATABASE_URL`, a unique `NEXTAUTH_SECRET`, and Razorpay test keys. To provision the first admin, set `ADMIN_INITIAL_EMAIL` and a unique password of at least 12 characters.
2. Run `npm ci`, then `npx prisma generate`.
3. Review the target database, then run `npx prisma db push` against a development database. Never use `--force-reset` against populated data.
4. Run `npm run prisma:seed`, then `npm run dev`.
5. `npm run build` creates the production build; `npm start` serves it locally.

## Verification recorded

- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- `npx prisma validate`: blocked because `DATABASE_URL` is not configured in this workspace.
- `npm run lint`: not completed because ESLint configuration/dependency is missing and Next.js enters interactive setup.
- Browser, database, and test payment flows: not tested; require configured services and credentials.
