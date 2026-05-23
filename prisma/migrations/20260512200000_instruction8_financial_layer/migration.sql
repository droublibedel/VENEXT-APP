-- Instruction 8 — wallet / transaction orchestration / negotiation payment modes

ALTER TYPE "WalletStatus" ADD VALUE IF NOT EXISTS 'LIMITED';
ALTER TYPE "WalletStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE "WalletStatus" ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';

ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'INITIATED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'SUCCESS';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "nonce" TEXT NOT NULL DEFAULT '';
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "payloadSignature" TEXT NOT NULL DEFAULT '';
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "transactions_status_createdAt_idx" ON "transactions"("status", "createdAt");

ALTER TABLE "negotiations" ADD COLUMN IF NOT EXISTS "proposedPaymentMode" "PaymentMode";
ALTER TABLE "negotiations" ADD COLUMN IF NOT EXISTS "acceptedPaymentMode" "PaymentMode";
ALTER TABLE "negotiations" ADD COLUMN IF NOT EXISTS "paymentConstraints" JSONB NOT NULL DEFAULT '{}';
