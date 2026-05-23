-- Instruction 20.17 — relational scenario review & human decision board (no commerce mutations)

CREATE TYPE "RelationalScenarioReviewStatus" AS ENUM (
  'PENDING_REVIEW',
  'UNDER_ANALYSIS',
  'APPROVED',
  'REJECTED',
  'PARTIALLY_APPROVED',
  'ARCHIVED',
  'EXPIRED'
);

CREATE TYPE "RelationalScenarioDecisionType" AS ENUM (
  'APPROVE_SIMULATION',
  'REJECT_SIMULATION',
  'REQUEST_REEVALUATION',
  'APPROVE_ORCHESTRATION',
  'REJECT_ORCHESTRATION',
  'APPROVE_RECOVERY_PLAN',
  'ESCALATE_CORRIDOR_REVIEW',
  'REQUEST_MANUAL_VALIDATION'
);

CREATE TYPE "RelationalScenarioDecisionSeverity" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "RelationalScenarioReviewEventType" AS ENUM (
  'REVIEW_CREATED',
  'REVIEW_APPROVED',
  'REVIEW_REJECTED',
  'REVIEW_ESCALATED',
  'REVIEW_ARCHIVED',
  'EXECUTIVE_VALIDATION_REQUIRED'
);

CREATE TABLE "relational_scenario_review_boards" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "simulationId" UUID,
  "orchestrationId" UUID,
  "recommendationId" UUID,
  "reviewStatus" "RelationalScenarioReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "decisionType" "RelationalScenarioDecisionType" NOT NULL,
  "decisionSeverity" "RelationalScenarioDecisionSeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "decisionSummary" TEXT,
  "requiresExecutiveValidation" BOOLEAN NOT NULL DEFAULT false,
  "requiresDualValidation" BOOLEAN NOT NULL DEFAULT false,
  "reviewedByOrganizationId" UUID,
  "reviewedByUserId" UUID,
  "approvedAt" TIMESTAMPTZ,
  "rejectedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_scenario_review_boards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_scenario_review_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reviewBoardId" UUID NOT NULL,
  "eventType" "RelationalScenarioReviewEventType" NOT NULL,
  "previousStatus" "RelationalScenarioReviewStatus",
  "nextStatus" "RelationalScenarioReviewStatus",
  "actorOrganizationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_scenario_review_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "relational_scenario_review_boards"
  ADD CONSTRAINT "relational_scenario_review_boards_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_scenario_review_boards"
  ADD CONSTRAINT "relational_scenario_review_boards_simulationId_fkey"
  FOREIGN KEY ("simulationId") REFERENCES "relational_operational_simulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_scenario_review_boards"
  ADD CONSTRAINT "relational_scenario_review_boards_orchestrationId_fkey"
  FOREIGN KEY ("orchestrationId") REFERENCES "relational_operational_orchestrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_scenario_review_boards"
  ADD CONSTRAINT "relational_scenario_review_boards_recommendationId_fkey"
  FOREIGN KEY ("recommendationId") REFERENCES "relational_operational_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_scenario_review_events"
  ADD CONSTRAINT "relational_scenario_review_events_reviewBoardId_fkey"
  FOREIGN KEY ("reviewBoardId") REFERENCES "relational_scenario_review_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "relational_scenario_review_boards_relationshipId_idx" ON "relational_scenario_review_boards"("relationshipId");
CREATE INDEX "relational_scenario_review_boards_reviewStatus_idx" ON "relational_scenario_review_boards"("reviewStatus");
CREATE INDEX "relational_scenario_review_boards_decisionType_idx" ON "relational_scenario_review_boards"("decisionType");
CREATE INDEX "relational_scenario_review_boards_decisionSeverity_idx" ON "relational_scenario_review_boards"("decisionSeverity");
CREATE INDEX "relational_scenario_review_boards_simulationId_idx" ON "relational_scenario_review_boards"("simulationId");
CREATE INDEX "relational_scenario_review_boards_orchestrationId_idx" ON "relational_scenario_review_boards"("orchestrationId");

CREATE INDEX "relational_scenario_review_events_reviewBoardId_idx" ON "relational_scenario_review_events"("reviewBoardId");
CREATE INDEX "relational_scenario_review_events_eventType_idx" ON "relational_scenario_review_events"("eventType");
CREATE INDEX "relational_scenario_review_events_createdAt_idx" ON "relational_scenario_review_events"("createdAt");
