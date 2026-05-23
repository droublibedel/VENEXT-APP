-- Instruction 20.15 — deterministic operational orchestration engine

CREATE TYPE "RelationalOperationalOrchestrationStatus" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'WAITING_VALIDATION',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
  'EXPIRED'
);

CREATE TYPE "RelationalOperationalOrchestrationPriority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "RelationalOperationalOrchestrationType" AS ENUM (
  'SLA_STABILIZATION',
  'INCIDENT_CONTAINMENT',
  'EXECUTION_RECOVERY',
  'FULFILLMENT_STABILIZATION',
  'CORRIDOR_RECOVERY',
  'COORDINATION_REBALANCING',
  'GOVERNANCE_REVIEW',
  'COLLAPSE_PREVENTION',
  'PARTNER_ALIGNMENT',
  'DOCUMENT_REINFORCEMENT'
);

CREATE TYPE "RelationalOperationalOrchestrationStepStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'SKIPPED',
  'CANCELLED'
);

CREATE TABLE "relational_operational_orchestrations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "orchestrationType" "RelationalOperationalOrchestrationType" NOT NULL,
  "status" "RelationalOperationalOrchestrationStatus" NOT NULL DEFAULT 'DRAFT',
  "priority" "RelationalOperationalOrchestrationPriority" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "orchestrationCode" TEXT NOT NULL,
  "sourceRecommendationId" UUID,
  "orchestrationDiagnostics" JSONB,
  "orchestrationMetadata" JSONB,
  "riskScore" INTEGER NOT NULL,
  "confidenceLevel" INTEGER NOT NULL,
  "requiresHumanValidation" BOOLEAN NOT NULL DEFAULT false,
  "approvedAt" TIMESTAMP(3),
  "approvedByUserId" UUID,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_operational_orchestrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_operational_orchestration_steps" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orchestrationId" UUID NOT NULL,
  "stepCode" TEXT NOT NULL,
  "stepTitle" TEXT NOT NULL,
  "stepDescription" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "stepStatus" "RelationalOperationalOrchestrationStepStatus" NOT NULL DEFAULT 'PENDING',
  "blockingStep" BOOLEAN NOT NULL DEFAULT false,
  "assignedOrganizationId" UUID,
  "assignedUserId" UUID,
  "completedAt" TIMESTAMP(3),
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_operational_orchestration_steps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_operational_orchestrations_relationshipId_idx" ON "relational_operational_orchestrations"("relationshipId");
CREATE INDEX "relational_operational_orchestrations_status_idx" ON "relational_operational_orchestrations"("status");
CREATE INDEX "relational_operational_orchestrations_priority_idx" ON "relational_operational_orchestrations"("priority");
CREATE INDEX "relational_operational_orchestrations_orchestrationType_idx" ON "relational_operational_orchestrations"("orchestrationType");
CREATE INDEX "relational_operational_orchestrations_orchestrationCode_idx" ON "relational_operational_orchestrations"("orchestrationCode");

CREATE INDEX "relational_operational_orchestration_steps_orchestrationId_idx" ON "relational_operational_orchestration_steps"("orchestrationId");
CREATE INDEX "relational_operational_orchestration_steps_stepOrder_idx" ON "relational_operational_orchestration_steps"("stepOrder");

ALTER TABLE "relational_operational_orchestrations" ADD CONSTRAINT "relational_operational_orchestrations_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_operational_orchestrations" ADD CONSTRAINT "relational_operational_orchestrations_sourceRecommendationId_fkey" FOREIGN KEY ("sourceRecommendationId") REFERENCES "relational_operational_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_operational_orchestration_steps" ADD CONSTRAINT "relational_operational_orchestration_steps_orchestrationId_fkey" FOREIGN KEY ("orchestrationId") REFERENCES "relational_operational_orchestrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
