-- ============================================================================
-- PREHERITAGE SUPPLEMENTARY MIGRATION: Complete Baseline Discrepancies
-- Resolves baseline schema gaps for fresh databases and enforces unique indexes
-- ============================================================================

-- 1. CreateTable if not exists: heritage_philosophy
CREATE TABLE IF NOT EXISTS "heritage_philosophy" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "paragraph1" TEXT NOT NULL,
    "paragraph2" TEXT NOT NULL,
    "highlightQuote" TEXT NOT NULL,
    "paragraph3" TEXT NOT NULL,
    "value1Title" TEXT NOT NULL,
    "value1Subtitle" TEXT NOT NULL,
    "value2Title" TEXT NOT NULL,
    "value2Subtitle" TEXT NOT NULL,
    "value3Title" TEXT NOT NULL,
    "value3Subtitle" TEXT NOT NULL,
    "cardTitle" TEXT NOT NULL,
    "cardQuote" TEXT NOT NULL,
    "memoirLinkText" TEXT NOT NULL,
    "memoirLinkUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "heritage_philosophy_pkey" PRIMARY KEY ("id")
);

-- 2. AlterTable: categories add metadata columns if not exists
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "focalPoint" TEXT;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "imageAlt" TEXT;

-- 3. Duplicate check for payments before unique index creation
DO $$
DECLARE
    dup_orders INT;
    dup_payments INT;
BEGIN
    SELECT COUNT(*) INTO dup_orders
    FROM (
        SELECT "razorpayOrderId"
        FROM "payments"
        WHERE "razorpayOrderId" IS NOT NULL
        GROUP BY "razorpayOrderId"
        HAVING COUNT(*) > 1
    ) dups;

    IF dup_orders > 0 THEN
        RAISE EXCEPTION 'Cannot create unique index payments_razorpayOrderId_key: % duplicate non-null razorpayOrderId values found', dup_orders;
    END IF;

    SELECT COUNT(*) INTO dup_payments
    FROM (
        SELECT "razorpayPaymentId"
        FROM "payments"
        WHERE "razorpayPaymentId" IS NOT NULL
        GROUP BY "razorpayPaymentId"
        HAVING COUNT(*) > 1
    ) dups;

    IF dup_payments > 0 THEN
        RAISE EXCEPTION 'Cannot create unique index payments_razorpayPaymentId_key: % duplicate non-null razorpayPaymentId values found', dup_payments;
    END IF;
END $$;

-- 4. CreateIndex: payments razorpayOrderId and razorpayPaymentId unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "payments_razorpayOrderId_key" 
ON "payments"("razorpayOrderId");

CREATE UNIQUE INDEX IF NOT EXISTS "payments_razorpayPaymentId_key" 
ON "payments"("razorpayPaymentId");

