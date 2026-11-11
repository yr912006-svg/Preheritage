-- ============================================================================
-- PREHERITAGE SUPPLEMENTARY MIGRATION: Bridge Production Baseline Drift
-- Bridges orders checkoutIdempotencyKey, checkoutRequestFingerprint, and unique index
-- ============================================================================

-- 1. AlterTable: orders add missing idempotency columns if not exists
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkoutIdempotencyKey" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "checkoutRequestFingerprint" TEXT;

-- 2. Duplicate check for checkoutIdempotencyKey before unique index creation
DO $$
DECLARE
    dup_keys INT;
BEGIN
    SELECT COUNT(*) INTO dup_keys
    FROM (
        SELECT "checkoutIdempotencyKey"
        FROM "orders"
        WHERE "checkoutIdempotencyKey" IS NOT NULL
        GROUP BY "checkoutIdempotencyKey"
        HAVING COUNT(*) > 1
    ) dups;

    IF dup_keys > 0 THEN
        RAISE EXCEPTION 'Cannot create unique index orders_checkoutIdempotencyKey_key: % duplicate non-null checkoutIdempotencyKey values found', dup_keys;
    END IF;
END $$;

-- 3. CreateIndex: orders checkoutIdempotencyKey unique index if not exists
CREATE UNIQUE INDEX IF NOT EXISTS "orders_checkoutIdempotencyKey_key" 
ON "orders"("checkoutIdempotencyKey");
