-- Instruction 20.29 — Relational Economic Recovery Planning

CREATE TYPE "RelationalEconomicRecoverySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicRecoveryStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'SUSPENDED');
CREATE TYPE "RelationalEconomicRecoveryType" AS ENUM (
  'CORRIDOR_STABILIZATION',
  'DEPENDENCY_REMEDIATION',
  'CONTINUITY_RESTORATION',
  'SOVEREIGNTY_REINFORCEMENT',
  'SYSTEMIC_CONTAINMENT'
);
CREATE TYPE "RelationalEconomicRecoveryPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicRecoveryStepType" AS ENUM (
  'PRIORITY_STABILIZATION',
  'DEPENDENCY_REDUCTION',
  'FLOW_REBALANCING',
  'PRESSURE_CONTAINMENT',
  'CONTINUITY_RECOVERY',
  'SOVEREIGNTY_REINFORCEMENT',
  'SECTOR_REBALANCING',
  'TERRITORIAL_REALIGNMENT',
  'SYSTEMIC_RISK_CONTAINMENT',
  'RECOVERY_VALIDATION'
);
CREATE TYPE "RelationalEconomicRecoveryEventType" AS ENUM (
  'PLAN_GENERATED',
  'PRIORITY_DETECTED',
  'INSTABILITY_DETECTED',
  'SYSTEMIC_RISK_DETECTED',
  'RECOVERY_UPDATED',
  'PLAN_ARCHIVED'
);

CREATE TABLE "relational_economic_recovery_plans" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "sovereigntyNodeId" UUID,
  "continuityNodeId" UUID,
  "macroEconomicNodeId" UUID,
  "supplyFlowNodeId" UUID,
  "geoZoneId" UUID,
  "sectorNodeId" UUID,
  "orchestrationId" UUID,
  "reviewBoardId" UUID,
  "strategicMemoryId" UUID,
  "planCode" TEXT NOT NULL,
  "recoveryType" "RelationalEconomicRecoveryType" NOT NULL,
  "recoveryPriority" "RelationalEconomicRecoveryPriority" NOT NULL,
  "recoveryStatus" "RelationalEconomicRecoveryStatus" NOT NULL,
  "severity" "RelationalEconomicRecoverySeverity" NOT NULL,
  "recoveryScore" INTEGER NOT NULL DEFAULT 0,
  "instabilityScore" INTEGER NOT NULL DEFAULT 0,
  "dependencyExposure" INTEGER NOT NULL DEFAULT 0,
  "continuityPressure" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyPressure" INTEGER NOT NULL DEFAULT 0,
  "corridorRecoveryProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "estimatedRecoveryDuration" INTEGER NOT NULL DEFAULT 0,
  "recoveryComplexity" INTEGER NOT NULL DEFAULT 0,
  "interventionPriority" INTEGER NOT NULL DEFAULT 0,
  "systemicImpactRisk" INTEGER NOT NULL DEFAULT 0,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "sectorSlug" TEXT,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_economic_recovery_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_recovery_steps" (
  "id" UUID NOT NULL,
  "recoveryPlanId" UUID NOT NULL,
  "stepCode" TEXT NOT NULL,
  "stepOrder" INTEGER NOT NULL,
  "stepType" "RelationalEconomicRecoveryStepType" NOT NULL,
  "blocking" BOOLEAN NOT NULL DEFAULT false,
  "estimatedDuration" INTEGER NOT NULL DEFAULT 0,
  "dependencyLevel" INTEGER NOT NULL DEFAULT 0,
  "recoveryImpactScore" INTEGER NOT NULL DEFAULT 0,
  "recoveryRiskScore" INTEGER NOT NULL DEFAULT 0,
  "confidenceLevel" TEXT NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_economic_recovery_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_recovery_signals" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "recoveryPlanId" UUID,
  "signalType" TEXT NOT NULL,
  "severity" "RelationalEconomicRecoverySeverity" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "description" VARCHAR(4000) NOT NULL,
  "signalScore" INTEGER NOT NULL,
  "recoveryContribution" INTEGER NOT NULL,
  "instabilityPressure" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_economic_recovery_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_recovery_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "recoveryPlanId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "recoveryStatus" "RelationalEconomicRecoveryStatus" NOT NULL,
  "recoveryScore" INTEGER NOT NULL,
  "instabilityScore" INTEGER NOT NULL,
  "corridorRecoveryProbability" DOUBLE PRECISION NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_economic_recovery_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_recovery_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "recoveryPlanId" UUID,
  "eventType" "RelationalEconomicRecoveryEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_economic_recovery_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_economic_recovery_plans_planCode_key" ON "relational_economic_recovery_plans"("planCode");
CREATE INDEX "relational_economic_recovery_plans_relationshipId_idx" ON "relational_economic_recovery_plans"("relationshipId");
CREATE INDEX "relational_economic_recovery_plans_recoveryScore_idx" ON "relational_economic_recovery_plans"("recoveryScore");
CREATE INDEX "relational_economic_recovery_plans_instabilityScore_idx" ON "relational_economic_recovery_plans"("instabilityScore");
CREATE INDEX "relational_economic_recovery_plans_corridorRecoveryProbability_idx" ON "relational_economic_recovery_plans"("corridorRecoveryProbability");
CREATE INDEX "relational_economic_recovery_plans_territoryCountry_idx" ON "relational_economic_recovery_plans"("territoryCountry");
CREATE INDEX "relational_economic_recovery_plans_sectorSlug_idx" ON "relational_economic_recovery_plans"("sectorSlug");
CREATE INDEX "relational_economic_recovery_plans_recoveryType_idx" ON "relational_economic_recovery_plans"("recoveryType");
CREATE INDEX "relational_economic_recovery_plans_recoveryPriority_idx" ON "relational_economic_recovery_plans"("recoveryPriority");
CREATE INDEX "relational_economic_recovery_plans_createdAt_idx" ON "relational_economic_recovery_plans"("createdAt");

CREATE INDEX "relational_economic_recovery_steps_recoveryPlanId_idx" ON "relational_economic_recovery_steps"("recoveryPlanId");
CREATE INDEX "relational_economic_recovery_steps_stepOrder_idx" ON "relational_economic_recovery_steps"("stepOrder");

CREATE INDEX "relational_economic_recovery_signals_relationshipId_idx" ON "relational_economic_recovery_signals"("relationshipId");
CREATE INDEX "relational_economic_recovery_signals_recoveryPlanId_idx" ON "relational_economic_recovery_signals"("recoveryPlanId");
CREATE INDEX "relational_economic_recovery_signals_createdAt_idx" ON "relational_economic_recovery_signals"("createdAt");

CREATE UNIQUE INDEX "relational_economic_recovery_snapshots_snapshotCode_key" ON "relational_economic_recovery_snapshots"("snapshotCode");
CREATE INDEX "relational_economic_recovery_snapshots_relationshipId_idx" ON "relational_economic_recovery_snapshots"("relationshipId");
CREATE INDEX "relational_economic_recovery_snapshots_recoveryScore_idx" ON "relational_economic_recovery_snapshots"("recoveryScore");
CREATE INDEX "relational_economic_recovery_snapshots_instabilityScore_idx" ON "relational_economic_recovery_snapshots"("instabilityScore");
CREATE INDEX "relational_economic_recovery_snapshots_createdAt_idx" ON "relational_economic_recovery_snapshots"("createdAt");

CREATE INDEX "relational_economic_recovery_events_relationshipId_idx" ON "relational_economic_recovery_events"("relationshipId");
CREATE INDEX "relational_economic_recovery_events_recoveryPlanId_idx" ON "relational_economic_recovery_events"("recoveryPlanId");
CREATE INDEX "relational_economic_recovery_events_eventType_idx" ON "relational_economic_recovery_events"("eventType");
CREATE INDEX "relational_economic_recovery_events_createdAt_idx" ON "relational_economic_recovery_events"("createdAt");

ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_orchestrationId_fkey" FOREIGN KEY ("orchestrationId") REFERENCES "relational_operational_orchestrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_reviewBoardId_fkey" FOREIGN KEY ("reviewBoardId") REFERENCES "relational_scenario_review_boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_plans" ADD CONSTRAINT "relational_economic_recovery_plans_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_recovery_steps" ADD CONSTRAINT "relational_economic_recovery_steps_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_recovery_signals" ADD CONSTRAINT "relational_economic_recovery_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_signals" ADD CONSTRAINT "relational_economic_recovery_signals_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_recovery_snapshots" ADD CONSTRAINT "relational_economic_recovery_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_snapshots" ADD CONSTRAINT "relational_economic_recovery_snapshots_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_recovery_events" ADD CONSTRAINT "relational_economic_recovery_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_recovery_events" ADD CONSTRAINT "relational_economic_recovery_events_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
