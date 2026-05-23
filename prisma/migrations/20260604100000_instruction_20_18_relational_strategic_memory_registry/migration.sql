-- Instruction 20.18 — relational strategic memory & corridor learning registry (deterministic, no opaque ML)

CREATE TYPE "RelationalStrategicMemoryStatus" AS ENUM (
  'ACTIVE',
  'ARCHIVED',
  'SUPERSEDED',
  'INVALIDATED',
  'EXPIRED'
);

CREATE TYPE "RelationalStrategicMemoryType" AS ENUM (
  'OPERATIONAL_PATTERN',
  'SLA_RECOVERY',
  'INCIDENT_RESOLUTION',
  'COLLAPSE_PREVENTION',
  'GOVERNANCE_ACTION',
  'EXECUTION_RECOVERY',
  'FULFILLMENT_STRATEGY',
  'PARTNER_BEHAVIOR_PATTERN',
  'COORDINATION_RECOVERY',
  'HUMAN_DECISION_PATTERN'
);

CREATE TYPE "RelationalStrategicMemorySeverity" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "RelationalStrategicMemoryEventType" AS ENUM (
  'MEMORY_CREATED',
  'MEMORY_REUSED',
  'MEMORY_ARCHIVED',
  'MEMORY_INVALIDATED',
  'MEMORY_PATTERN_DETECTED',
  'MEMORY_OUTCOME_ASSESSED'
);

CREATE TABLE "relational_strategic_memories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "memoryStatus" "RelationalStrategicMemoryStatus" NOT NULL DEFAULT 'ACTIVE',
  "memoryType" "RelationalStrategicMemoryType" NOT NULL,
  "memorySeverity" "RelationalStrategicMemorySeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "memoryCode" TEXT NOT NULL,
  "sourceSimulationId" UUID,
  "sourceRecommendationId" UUID,
  "sourceOrchestrationId" UUID,
  "sourceReviewBoardId" UUID,
  "sourceIncidentId" UUID,
  "sourceFulfillmentId" UUID,
  "strategicSummary" TEXT NOT NULL,
  "observedPattern" TEXT NOT NULL,
  "recoveryStrategy" TEXT,
  "outcomeAssessment" TEXT,
  "reuseRecommendation" TEXT,
  "confidenceLevel" INTEGER NOT NULL,
  "reuseCount" INTEGER NOT NULL DEFAULT 0,
  "successfulReuseCount" INTEGER NOT NULL DEFAULT 0,
  "failedReuseCount" INTEGER NOT NULL DEFAULT 0,
  "lastReusedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_memories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_strategic_memory_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "memoryId" UUID NOT NULL,
  "eventType" "RelationalStrategicMemoryEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_memory_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "relational_strategic_memories"
  ADD CONSTRAINT "relational_strategic_memories_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_memories"
  ADD CONSTRAINT "relational_strategic_memories_sourceSimulationId_fkey"
  FOREIGN KEY ("sourceSimulationId") REFERENCES "relational_operational_simulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_memories"
  ADD CONSTRAINT "relational_strategic_memories_sourceRecommendationId_fkey"
  FOREIGN KEY ("sourceRecommendationId") REFERENCES "relational_operational_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_memories"
  ADD CONSTRAINT "relational_strategic_memories_sourceOrchestrationId_fkey"
  FOREIGN KEY ("sourceOrchestrationId") REFERENCES "relational_operational_orchestrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_memories"
  ADD CONSTRAINT "relational_strategic_memories_sourceReviewBoardId_fkey"
  FOREIGN KEY ("sourceReviewBoardId") REFERENCES "relational_scenario_review_boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_memories"
  ADD CONSTRAINT "relational_strategic_memories_sourceIncidentId_fkey"
  FOREIGN KEY ("sourceIncidentId") REFERENCES "relational_fulfillment_incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_memories"
  ADD CONSTRAINT "relational_strategic_memories_sourceFulfillmentId_fkey"
  FOREIGN KEY ("sourceFulfillmentId") REFERENCES "relational_fulfillment_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_memory_events"
  ADD CONSTRAINT "relational_strategic_memory_events_memoryId_fkey"
  FOREIGN KEY ("memoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "relational_strategic_memories_relationshipId_idx" ON "relational_strategic_memories"("relationshipId");
CREATE INDEX "relational_strategic_memories_memoryType_idx" ON "relational_strategic_memories"("memoryType");
CREATE INDEX "relational_strategic_memories_memorySeverity_idx" ON "relational_strategic_memories"("memorySeverity");
CREATE INDEX "relational_strategic_memories_memoryStatus_idx" ON "relational_strategic_memories"("memoryStatus");
CREATE INDEX "relational_strategic_memories_memoryCode_idx" ON "relational_strategic_memories"("memoryCode");

CREATE INDEX "relational_strategic_memory_events_memoryId_idx" ON "relational_strategic_memory_events"("memoryId");
CREATE INDEX "relational_strategic_memory_events_eventType_idx" ON "relational_strategic_memory_events"("eventType");
CREATE INDEX "relational_strategic_memory_events_createdAt_idx" ON "relational_strategic_memory_events"("createdAt");
