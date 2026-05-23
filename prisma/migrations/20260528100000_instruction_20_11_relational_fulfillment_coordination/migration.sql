-- Instruction 20.11 — relational fulfillment operational coordination tasks

CREATE TYPE "RelationalFulfillmentTaskStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'WAITING_EXTERNAL_CONFIRMATION',
  'WAITING_CORRIDOR_VALIDATION',
  'BLOCKED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "RelationalFulfillmentTaskPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "RelationalFulfillmentTaskType" AS ENUM (
  'DOCUMENT_REQUEST',
  'PROOF_CORRECTION',
  'QUANTITY_REVIEW',
  'DELIVERY_ALIGNMENT',
  'LOADING_VALIDATION',
  'RECEPTION_COORDINATION',
  'INCIDENT_FOLLOW_UP',
  'RETURN_ALIGNMENT',
  'MANUAL_OPERATION',
  'CORRIDOR_VALIDATION',
  'COMPLIANCE_REVIEW'
);

CREATE TYPE "RelationalFulfillmentTaskEventType" AS ENUM (
  'TASK_CREATED',
  'TASK_ASSIGNED',
  'TASK_STATUS_CHANGED',
  'TASK_BLOCKED',
  'TASK_COMPLETED',
  'TASK_CANCELLED',
  'TASK_REOPENED',
  'TASK_COMMENT_ADDED'
);

CREATE TABLE "relational_fulfillment_tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "fulfillmentRecordId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "orderId" UUID NOT NULL,
  "taskType" "RelationalFulfillmentTaskType" NOT NULL,
  "taskStatus" "RelationalFulfillmentTaskStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "RelationalFulfillmentTaskPriority" NOT NULL DEFAULT 'NORMAL',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "assignedOrganizationId" UUID,
  "assignedUserId" UUID,
  "createdByOrganizationId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "blockingFulfillment" BOOLEAN NOT NULL DEFAULT false,
  "requiresBuyerConfirmation" BOOLEAN NOT NULL DEFAULT false,
  "requiresSellerConfirmation" BOOLEAN NOT NULL DEFAULT false,
  "buyerConfirmedAt" TIMESTAMP(3),
  "sellerConfirmedAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "metadata" JSONB,
  "diagnostics" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_fulfillment_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_fulfillment_task_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "taskId" UUID NOT NULL,
  "eventType" "RelationalFulfillmentTaskEventType" NOT NULL,
  "previousStatus" "RelationalFulfillmentTaskStatus",
  "nextStatus" "RelationalFulfillmentTaskStatus",
  "actorOrganizationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "comment" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_fulfillment_task_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_fulfillment_tasks_fulfillmentRecordId_idx" ON "relational_fulfillment_tasks"("fulfillmentRecordId");
CREATE INDEX "relational_fulfillment_tasks_relationshipId_idx" ON "relational_fulfillment_tasks"("relationshipId");
CREATE INDEX "relational_fulfillment_tasks_taskStatus_idx" ON "relational_fulfillment_tasks"("taskStatus");
CREATE INDEX "relational_fulfillment_tasks_priority_idx" ON "relational_fulfillment_tasks"("priority");
CREATE INDEX "relational_fulfillment_tasks_assignedOrganizationId_idx" ON "relational_fulfillment_tasks"("assignedOrganizationId");

CREATE INDEX "relational_fulfillment_task_events_taskId_idx" ON "relational_fulfillment_task_events"("taskId");
CREATE INDEX "relational_fulfillment_task_events_eventType_idx" ON "relational_fulfillment_task_events"("eventType");

ALTER TABLE "relational_fulfillment_tasks"
  ADD CONSTRAINT "relational_fulfillment_tasks_fulfillmentRecordId_fkey"
  FOREIGN KEY ("fulfillmentRecordId") REFERENCES "relational_fulfillment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_fulfillment_tasks"
  ADD CONSTRAINT "relational_fulfillment_tasks_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_fulfillment_task_events"
  ADD CONSTRAINT "relational_fulfillment_task_events_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "relational_fulfillment_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
