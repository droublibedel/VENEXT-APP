-- Instruction 20.10 — fulfillment incident resolution & reception dispute workflow

CREATE TYPE "RelationalFulfillmentIncidentResolutionStatus" AS ENUM (
  'OPEN',
  'RESOLUTION_PROPOSED',
  'ACCEPTED_BY_SELLER',
  'ACCEPTED_BY_BUYER',
  'ACCEPTED_BY_BOTH_PARTIES',
  'RESOLVED',
  'REJECTED',
  'ESCALATION_REQUIRED'
);

ALTER TYPE "RelationalFulfillmentEventType" ADD VALUE 'RECEPTION_REJECTED';
ALTER TYPE "RelationalFulfillmentEventType" ADD VALUE 'PARTIAL_RECEPTION_VALIDATED';
ALTER TYPE "RelationalFulfillmentEventType" ADD VALUE 'INCIDENT_RESOLUTION_PROPOSED';
ALTER TYPE "RelationalFulfillmentEventType" ADD VALUE 'INCIDENT_RESOLUTION_ACCEPTED';
ALTER TYPE "RelationalFulfillmentEventType" ADD VALUE 'INCIDENT_RESOLVED';
ALTER TYPE "RelationalFulfillmentEventType" ADD VALUE 'INCIDENT_ESCALATION_REQUIRED';

ALTER TABLE "relational_fulfillment_incidents"
  ADD COLUMN "resolutionStatus" "RelationalFulfillmentIncidentResolutionStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "resolutionRequestedAt" TIMESTAMP(3),
  ADD COLUMN "resolutionRequestedByOrganizationId" UUID,
  ADD COLUMN "resolutionRequestedByUserId" UUID,
  ADD COLUMN "resolutionProposal" TEXT,
  ADD COLUMN "sellerResolutionAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "sellerResolutionAcceptedByUserId" UUID,
  ADD COLUMN "buyerResolutionAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "buyerResolutionAcceptedByUserId" UUID,
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedByUserId" UUID,
  ADD COLUMN "resolutionNotes" TEXT,
  ADD COLUMN "resolutionDiagnostics" JSONB;

CREATE INDEX "relational_fulfillment_incidents_resolutionStatus_idx"
  ON "relational_fulfillment_incidents"("resolutionStatus");
