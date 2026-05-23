-- Instruction 20.8 — relational order execution layer (corridor-private, not consumer tracking).

CREATE TYPE "RelationalOrderExecutionStatus" AS ENUM (
  'CREATED',
  'PREPARING',
  'READY_FOR_DISPATCH',
  'DISPATCHED',
  'IN_TRANSIT',
  'ARRIVED',
  'RECEIVED',
  'COMPLETED',
  'BLOCKED',
  'PARTIALLY_FULFILLED',
  'REJECTED_AT_RECEPTION',
  'CANCELLED',
  'RETURN_REVIEW'
);

CREATE TYPE "RelationalOrderExecutionEventType" AS ENUM (
  'PREPARATION_STARTED',
  'PREPARATION_COMPLETED',
  'DISPATCH_CONFIRMED',
  'TRANSIT_STARTED',
  'ARRIVAL_CONFIRMED',
  'RECEPTION_CONFIRMED',
  'EXECUTION_COMPLETED',
  'EXECUTION_BLOCKED',
  'PARTIAL_FULFILLMENT_DECLARED',
  'RECEPTION_REJECTED',
  'RETURN_REVIEW_REQUESTED'
);

ALTER TABLE "orders" ADD COLUMN "relational_order_execution_status" "RelationalOrderExecutionStatus" NOT NULL DEFAULT 'CREATED';

CREATE TABLE "relational_order_execution_events" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "relationshipId" UUID NOT NULL,
    "eventType" "RelationalOrderExecutionEventType" NOT NULL,
    "actorOrganizationId" UUID,
    "actorUserId" UUID,
    "previousStatus" "RelationalOrderExecutionStatus",
    "nextStatus" "RelationalOrderExecutionStatus" NOT NULL,
    "diagnostics" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relational_order_execution_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_order_execution_events_orderId_idx" ON "relational_order_execution_events"("orderId");
CREATE INDEX "relational_order_execution_events_relationshipId_idx" ON "relational_order_execution_events"("relationshipId");
CREATE INDEX "relational_order_execution_events_eventType_idx" ON "relational_order_execution_events"("eventType");

ALTER TABLE "relational_order_execution_events" ADD CONSTRAINT "relational_order_execution_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
