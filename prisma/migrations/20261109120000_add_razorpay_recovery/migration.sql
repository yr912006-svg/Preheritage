-- ============================================================================
-- PREHERITAGE ADDITIVE MIGRATION: Razorpay Recovery Objects
-- Dedicated migration for razorpay_checkouts and razorpay_webhook_events
-- ============================================================================

-- CreateTable: razorpay_checkouts
CREATE TABLE "razorpay_checkouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "snapshot" JSONB NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recoveryReason" TEXT,
    "recoveryAttempts" INTEGER NOT NULL DEFAULT 0,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: razorpay_webhook_events
CREATE TABLE "razorpay_webhook_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "claimToken" TEXT,
    "lastError" TEXT,
    "lockUntil" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: 1:1 mapping between gateway order and checkout intent
CREATE UNIQUE INDEX "razorpay_checkouts_razorpayOrderId_key" 
ON "razorpay_checkouts"("razorpayOrderId");

-- CreateIndex: 1:1 mapping between captured gateway payment and checkout intent
CREATE UNIQUE INDEX "razorpay_checkouts_razorpayPaymentId_key" 
ON "razorpay_checkouts"("razorpayPaymentId");

-- CreateIndex: 1:1 link between finalized order and checkout intent
CREATE UNIQUE INDEX "razorpay_checkouts_orderId_key" 
ON "razorpay_checkouts"("orderId");

-- CreateIndex: Polling and recovery status lookup index
CREATE INDEX "razorpay_checkouts_status_updatedAt_idx" 
ON "razorpay_checkouts"("status", "updatedAt");

-- CreateIndex: Gateway deduplication key
CREATE UNIQUE INDEX "razorpay_webhook_events_eventId_key" 
ON "razorpay_webhook_events"("eventId");

-- CreateIndex: Concurrency worker claim lease fence
CREATE UNIQUE INDEX "razorpay_webhook_events_claimToken_key" 
ON "razorpay_webhook_events"("claimToken");

-- CreateIndex: Worker queue lookup index
CREATE INDEX "razorpay_webhook_events_status_updatedAt_idx" 
ON "razorpay_webhook_events"("status", "updatedAt");

-- AddForeignKey: razorpay_checkouts -> orders
-- ON DELETE SET NULL ensures checkout snapshot is preserved if an order is cancelled or deleted.
ALTER TABLE "razorpay_checkouts" 
ADD CONSTRAINT "razorpay_checkouts_orderId_fkey" 
FOREIGN KEY ("orderId") REFERENCES "orders"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;
