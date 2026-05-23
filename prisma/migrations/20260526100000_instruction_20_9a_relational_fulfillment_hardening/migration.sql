-- Instruction 20.9A — fulfillment event journal + hardening

CREATE TYPE "RelationalFulfillmentEventType" AS ENUM (
  'FULFILLMENT_TRANSITIONED',
  'FULFILLMENT_PROOF_SUBMITTED',
  'RECEPTION_VALIDATED',
  'INCIDENT_REPORTED',
  'FULFILLMENT_COMPLETED',
  'FULFILLMENT_BLOCKED'
);

CREATE TABLE "relational_fulfillment_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fulfillmentRecordId" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "eventType" "RelationalFulfillmentEventType" NOT NULL,
  "previousStatus" "RelationalFulfillmentStatus",
  "nextStatus" "RelationalFulfillmentStatus",
  "actorOrganizationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_fulfillment_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_fulfillment_events_fulfillmentRecordId_idx" ON "relational_fulfillment_events"("fulfillmentRecordId");
CREATE INDEX "relational_fulfillment_events_orderId_idx" ON "relational_fulfillment_events"("orderId");
CREATE INDEX "relational_fulfillment_events_relationshipId_idx" ON "relational_fulfillment_events"("relationshipId");
CREATE INDEX "relational_fulfillment_events_eventType_idx" ON "relational_fulfillment_events"("eventType");

ALTER TABLE "relational_fulfillment_events"
  ADD CONSTRAINT "relational_fulfillment_events_fulfillmentRecordId_fkey"
  FOREIGN KEY ("fulfillmentRecordId") REFERENCES "relational_fulfillment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
