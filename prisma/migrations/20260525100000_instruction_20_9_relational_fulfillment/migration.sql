-- Instruction 20.9 — relational fulfillment & reception proof (B2B corridor, not consumer tracking)

CREATE TYPE "RelationalFulfillmentStatus" AS ENUM (
  'PREPARING_FULFILLMENT',
  'READY_FOR_LOADING',
  'LOADING_CONFIRMED',
  'IN_TRANSFER',
  'ARRIVED_AT_DESTINATION',
  'RECEPTION_PENDING_VALIDATION',
  'RECEPTION_VALIDATED',
  'RECEPTION_PARTIALLY_VALIDATED',
  'RECEPTION_REJECTED',
  'INCIDENT_REPORTED',
  'FULFILLMENT_COMPLETED',
  'FULFILLMENT_BLOCKED'
);

CREATE TYPE "RelationalFulfillmentProofType" AS ENUM (
  'RECEIPT_PHOTO',
  'RECEIPT_DOCUMENT',
  'RECEIPT_SIGNATURE_SCAN',
  'LOADING_DOCUMENT',
  'DAMAGE_EVIDENCE'
);

CREATE TYPE "RelationalFulfillmentIncidentType" AS ENUM (
  'DAMAGED_GOODS',
  'PARTIAL_RECEPTION',
  'DOCUMENT_MISMATCH',
  'QUANTITY_MISMATCH',
  'PACKAGING_ISSUE',
  'FULFILLMENT_DELAY',
  'UNAUTHORIZED_SUBSTITUTION'
);

CREATE TABLE "relational_fulfillment_records" (
  "id" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "buyerOrganizationId" UUID NOT NULL,
  "sellerOrganizationId" UUID NOT NULL,
  "fulfillmentStatus" "RelationalFulfillmentStatus" NOT NULL DEFAULT 'PREPARING_FULFILLMENT',
  "proofRequired" BOOLEAN NOT NULL DEFAULT true,
  "proofValidated" BOOLEAN NOT NULL DEFAULT false,
  "receptionValidatedAt" TIMESTAMP(3),
  "receptionValidatedByUserId" UUID,
  "receptionValidationNotes" TEXT,
  "loadingConfirmedAt" TIMESTAMP(3),
  "transferStartedAt" TIMESTAMP(3),
  "arrivedAtDestinationAt" TIMESTAMP(3),
  "fulfillmentCompletedAt" TIMESTAMP(3),
  "blockedAt" TIMESTAMP(3),
  "blockedReason" TEXT,
  "metadata" JSONB,
  "diagnostics" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_fulfillment_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_fulfillment_records_orderId_key" ON "relational_fulfillment_records"("orderId");
CREATE INDEX "relational_fulfillment_records_relationshipId_idx" ON "relational_fulfillment_records"("relationshipId");
CREATE INDEX "relational_fulfillment_records_buyerOrganizationId_sellerOrganizationId_idx" ON "relational_fulfillment_records"("buyerOrganizationId", "sellerOrganizationId");
CREATE INDEX "relational_fulfillment_records_fulfillmentStatus_idx" ON "relational_fulfillment_records"("fulfillmentStatus");

ALTER TABLE "relational_fulfillment_records" ADD CONSTRAINT "relational_fulfillment_records_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_fulfillment_proofs" (
  "id" UUID NOT NULL,
  "fulfillmentRecordId" UUID NOT NULL,
  "proofType" "RelationalFulfillmentProofType" NOT NULL,
  "uploadedByOrganizationId" UUID NOT NULL,
  "uploadedByUserId" UUID NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_fulfillment_proofs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_fulfillment_proofs_fulfillmentRecordId_idx" ON "relational_fulfillment_proofs"("fulfillmentRecordId");

ALTER TABLE "relational_fulfillment_proofs" ADD CONSTRAINT "relational_fulfillment_proofs_fulfillmentRecordId_fkey" FOREIGN KEY ("fulfillmentRecordId") REFERENCES "relational_fulfillment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_fulfillment_incidents" (
  "id" UUID NOT NULL,
  "fulfillmentRecordId" UUID NOT NULL,
  "incidentType" "RelationalFulfillmentIncidentType" NOT NULL,
  "reportedByOrganizationId" UUID NOT NULL,
  "reportedByUserId" UUID NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_fulfillment_incidents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_fulfillment_incidents_fulfillmentRecordId_idx" ON "relational_fulfillment_incidents"("fulfillmentRecordId");

ALTER TABLE "relational_fulfillment_incidents" ADD CONSTRAINT "relational_fulfillment_incidents_fulfillmentRecordId_fkey" FOREIGN KEY ("fulfillmentRecordId") REFERENCES "relational_fulfillment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
