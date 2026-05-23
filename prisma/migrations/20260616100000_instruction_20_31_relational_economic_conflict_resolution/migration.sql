-- Instruction 20.31 — Relational Economic Conflict Resolution & Strategic Arbitration

CREATE TYPE "RelationalEconomicArbitrationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicArbitrationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "RelationalEconomicArbitrationType" AS ENUM ('CONFLICT_RESOLUTION', 'STRATEGIC_ARBITRATION', 'SYSTEMIC_STABILIZATION', 'MULTI_CORRIDOR_PRIORITY');
CREATE TYPE "RelationalEconomicArbitrationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicArbitrationScenarioType" AS ENUM (
  'STABILIZATION_FIRST',
  'DEPENDENCY_REDUCTION_FIRST',
  'CONTINUITY_FIRST',
  'SOVEREIGNTY_FIRST',
  'PRESSURE_CONTAINMENT_FIRST',
  'BALANCED_RECOVERY',
  'SYSTEMIC_CONTAINMENT',
  'TERRITORIAL_REBALANCING',
  'SECTOR_REBALANCING',
  'MINIMAL_INTERVENTION'
);
CREATE TYPE "RelationalEconomicArbitrationDecisionType" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'ARCHIVED');
CREATE TYPE "RelationalEconomicArbitrationEventType" AS ENUM (
  'CONFLICT_DETECTED',
  'SCENARIO_GENERATED',
  'DECISION_CREATED',
  'DECISION_VALIDATED',
  'DECISION_REJECTED',
  'PRIORITY_DETECTED',
  'SYSTEMIC_RISK_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_economic_arbitration_cases" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "governanceConflictId" UUID,
  "recoveryPlanId" UUID,
  "sovereigntyNodeId" UUID,
  "continuityNodeId" UUID,
  "macroEconomicNodeId" UUID,
  "supplyFlowNodeId" UUID,
  "geoZoneId" UUID,
  "sectorNodeId" UUID,
  "reviewBoardId" UUID,
  "strategicMemoryId" UUID,
  "orchestrationId" UUID,
  "caseCode" TEXT NOT NULL,
  "arbitrationType" "RelationalEconomicArbitrationType" NOT NULL,
  "arbitrationPriority" "RelationalEconomicArbitrationPriority" NOT NULL,
  "arbitrationStatus" "RelationalEconomicArbitrationStatus" NOT NULL,
  "severity" "RelationalEconomicArbitrationSeverity" NOT NULL,
  "arbitrationScore" INTEGER NOT NULL DEFAULT 0,
  "conflictSeverity" INTEGER NOT NULL DEFAULT 0,
  "systemicImpact" INTEGER NOT NULL DEFAULT 0,
  "dependencyPressure" INTEGER NOT NULL DEFAULT 0,
  "continuityPressure" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyPressure" INTEGER NOT NULL DEFAULT 0,
  "propagationPressure" INTEGER NOT NULL DEFAULT 0,
  "coordinationPressure" INTEGER NOT NULL DEFAULT 0,
  "resolutionComplexity" INTEGER NOT NULL DEFAULT 0,
  "resolutionProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "interventionUrgency" INTEGER NOT NULL DEFAULT 0,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "sectorSlug" TEXT,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relational_economic_arbitration_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_arbitration_scenarios" (
  "id" UUID NOT NULL,
  "arbitrationCaseId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "scenarioCode" TEXT NOT NULL,
  "scenarioType" "RelationalEconomicArbitrationScenarioType" NOT NULL,
  "priority" "RelationalEconomicArbitrationPriority" NOT NULL,
  "estimatedImpact" INTEGER NOT NULL DEFAULT 0,
  "estimatedRisk" INTEGER NOT NULL DEFAULT 0,
  "estimatedRecoveryGain" INTEGER NOT NULL DEFAULT 0,
  "dependencyImpact" INTEGER NOT NULL DEFAULT 0,
  "propagationImpact" INTEGER NOT NULL DEFAULT 0,
  "continuityImpact" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyImpact" INTEGER NOT NULL DEFAULT 0,
  "confidenceLevel" TEXT NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_arbitration_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_arbitration_decisions" (
  "id" UUID NOT NULL,
  "arbitrationCaseId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "selectedScenarioId" UUID,
  "decisionCode" TEXT NOT NULL,
  "decisionType" "RelationalEconomicArbitrationDecisionType" NOT NULL,
  "arbitrationReason" VARCHAR(2000) NOT NULL,
  "rejectedScenarioIds" JSONB,
  "systemicTradeoffs" JSONB,
  "expectedRecoveryGain" INTEGER NOT NULL DEFAULT 0,
  "expectedStabilityGain" INTEGER NOT NULL DEFAULT 0,
  "validationRequired" BOOLEAN NOT NULL DEFAULT true,
  "dualValidationRequired" BOOLEAN NOT NULL DEFAULT false,
  "validatedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relational_economic_arbitration_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_arbitration_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "arbitrationCaseId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "arbitrationStatus" "RelationalEconomicArbitrationStatus" NOT NULL,
  "arbitrationScore" INTEGER NOT NULL,
  "systemicImpact" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_arbitration_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_arbitration_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "arbitrationCaseId" UUID,
  "eventType" "RelationalEconomicArbitrationEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_arbitration_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_economic_arbitration_cases_caseCode_key" ON "relational_economic_arbitration_cases"("caseCode");
CREATE INDEX "relational_economic_arbitration_cases_relationshipId_idx" ON "relational_economic_arbitration_cases"("relationshipId");
CREATE INDEX "relational_economic_arbitration_cases_arbitrationScore_idx" ON "relational_economic_arbitration_cases"("arbitrationScore");
CREATE INDEX "relational_economic_arbitration_cases_conflictSeverity_idx" ON "relational_economic_arbitration_cases"("conflictSeverity");
CREATE INDEX "relational_economic_arbitration_cases_systemicImpact_idx" ON "relational_economic_arbitration_cases"("systemicImpact");
CREATE INDEX "relational_economic_arbitration_cases_territoryCountry_idx" ON "relational_economic_arbitration_cases"("territoryCountry");
CREATE INDEX "relational_economic_arbitration_cases_sectorSlug_idx" ON "relational_economic_arbitration_cases"("sectorSlug");
CREATE INDEX "relational_economic_arbitration_cases_arbitrationPriority_idx" ON "relational_economic_arbitration_cases"("arbitrationPriority");
CREATE INDEX "relational_economic_arbitration_cases_createdAt_idx" ON "relational_economic_arbitration_cases"("createdAt");

CREATE UNIQUE INDEX "relational_economic_arbitration_scenarios_scenarioCode_key" ON "relational_economic_arbitration_scenarios"("scenarioCode");
CREATE INDEX "relational_economic_arbitration_scenarios_arbitrationCaseId_idx" ON "relational_economic_arbitration_scenarios"("arbitrationCaseId");
CREATE INDEX "relational_economic_arbitration_scenarios_relationshipId_idx" ON "relational_economic_arbitration_scenarios"("relationshipId");

CREATE UNIQUE INDEX "relational_economic_arbitration_decisions_decisionCode_key" ON "relational_economic_arbitration_decisions"("decisionCode");
CREATE INDEX "relational_economic_arbitration_decisions_arbitrationCaseId_idx" ON "relational_economic_arbitration_decisions"("arbitrationCaseId");
CREATE INDEX "relational_economic_arbitration_decisions_relationshipId_idx" ON "relational_economic_arbitration_decisions"("relationshipId");

CREATE UNIQUE INDEX "relational_economic_arbitration_snapshots_snapshotCode_key" ON "relational_economic_arbitration_snapshots"("snapshotCode");
CREATE INDEX "relational_economic_arbitration_snapshots_relationshipId_idx" ON "relational_economic_arbitration_snapshots"("relationshipId");
CREATE INDEX "relational_economic_arbitration_snapshots_arbitrationScore_idx" ON "relational_economic_arbitration_snapshots"("arbitrationScore");
CREATE INDEX "relational_economic_arbitration_snapshots_systemicImpact_idx" ON "relational_economic_arbitration_snapshots"("systemicImpact");
CREATE INDEX "relational_economic_arbitration_snapshots_createdAt_idx" ON "relational_economic_arbitration_snapshots"("createdAt");

CREATE INDEX "relational_economic_arbitration_events_relationshipId_idx" ON "relational_economic_arbitration_events"("relationshipId");
CREATE INDEX "relational_economic_arbitration_events_arbitrationCaseId_idx" ON "relational_economic_arbitration_events"("arbitrationCaseId");
CREATE INDEX "relational_economic_arbitration_events_eventType_idx" ON "relational_economic_arbitration_events"("eventType");
CREATE INDEX "relational_economic_arbitration_events_createdAt_idx" ON "relational_economic_arbitration_events"("createdAt");

ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_governanceConflictId_fkey" FOREIGN KEY ("governanceConflictId") REFERENCES "relational_economic_governance_conflicts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_reviewBoardId_fkey" FOREIGN KEY ("reviewBoardId") REFERENCES "relational_scenario_review_boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_cases" ADD CONSTRAINT "relational_economic_arbitration_cases_orchestrationId_fkey" FOREIGN KEY ("orchestrationId") REFERENCES "relational_operational_orchestrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_arbitration_scenarios" ADD CONSTRAINT "relational_economic_arbitration_scenarios_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_scenarios" ADD CONSTRAINT "relational_economic_arbitration_scenarios_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_arbitration_decisions" ADD CONSTRAINT "relational_economic_arbitration_decisions_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_decisions" ADD CONSTRAINT "relational_economic_arbitration_decisions_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_decisions" ADD CONSTRAINT "relational_economic_arbitration_decisions_selectedScenarioId_fkey" FOREIGN KEY ("selectedScenarioId") REFERENCES "relational_economic_arbitration_scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_arbitration_snapshots" ADD CONSTRAINT "relational_economic_arbitration_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_snapshots" ADD CONSTRAINT "relational_economic_arbitration_snapshots_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_arbitration_events" ADD CONSTRAINT "relational_economic_arbitration_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_arbitration_events" ADD CONSTRAINT "relational_economic_arbitration_events_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
