-- Instruction 20.7 — relational cart dual confirmation & lock tracking (queryable columns, not metadata-only).

ALTER TABLE "relational_carts"
  ADD COLUMN "buyerConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "sellerConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "buyerConfirmedByUserId" UUID,
  ADD COLUMN "sellerConfirmedByUserId" UUID,
  ADD COLUMN "lockedAt" TIMESTAMP(3),
  ADD COLUMN "lockedByUserId" UUID,
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedByUserId" UUID,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "confirmationDiagnostics" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "lockDiagnostics" JSONB NOT NULL DEFAULT '{}';
