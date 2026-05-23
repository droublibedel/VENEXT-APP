-- Instruction 20.36 — Relational Strategic Economic Intelligence Consolidation & Executive Synthesis

CREATE TYPE "RelationalStrategicIntelligenceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalStrategicIntelligenceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalStrategicIntelligenceType" AS ENUM (
  'CONSOLIDATED_OVERVIEW',
  'EXECUTIVE_SYNTHESIS_DIGEST',
  'NETWORK_SUPERVISION',
  'STRATEGIC_ALIGNMENT'
);
CREATE TYPE "RelationalStrategicIntelligencePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalStrategicIntelligenceSignalType" AS ENUM (
  'STRATEGIC',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'ALIGNMENT'
);
CREATE TYPE "RelationalStrategicIntelligenceSynthesisType" AS ENUM (
  'EXECUTIVE_SYNTHESIS',
  'STRATEGIC_SYNTHESIS',
  'TERRITORIAL_SYNTHESIS',
  'SECTOR_SYNTHESIS',
  'SYSTEMIC_SYNTHESIS',
  'RESILIENCE_SYNTHESIS',
  'GOVERNANCE_SYNTHESIS'
);
CREATE TYPE "RelationalStrategicIntelligenceEventType" AS ENUM (
  'SYNTHESIS_GENERATED',
  'SYSTEMIC_PRESSURE_DETECTED',
  'EXECUTIVE_EXPOSURE_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_strategic_intelligence_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "institutionalReportingNodeId" UUID,
  "executiveOrchestrationNodeId" UUID,
  "monitoringNodeId" UUID,
  "stabilizationNodeId" UUID,
  "governanceNodeId" UUID,
  "arbitrationCaseId" UUID,
  "recoveryPlanId" UUID,
  "sovereigntyNodeId" UUID,
  "continuityNodeId" UUID,
  "macroEconomicNodeId" UUID,
  "supplyFlowNodeId" UUID,
  "geoZoneId" UUID,
  "sectorNodeId" UUID,
  "strategicMemoryId" UUID,
  "nodeCode" TEXT NOT NULL,
  "intelligenceType" "RelationalStrategicIntelligenceType" NOT NULL,
  "intelligencePriority" "RelationalStrategicIntelligencePriority" NOT NULL,
  "intelligenceStatus" "RelationalStrategicIntelligenceStatus" NOT NULL,
  "severity" "RelationalStrategicIntelligenceSeverity" NOT NULL,
  "strategicIntelligenceScore" INTEGER NOT NULL DEFAULT 0,
  "executiveExposure" INTEGER NOT NULL DEFAULT 0,
  "resilienceStrength" INTEGER NOT NULL DEFAULT 0,
  "systemicConcentration" INTEGER NOT NULL DEFAULT 0,
  "strategicAlignmentScore" INTEGER NOT NULL DEFAULT 0,
  "governancePressure" INTEGER NOT NULL DEFAULT 0,
  "arbitrationPressure" INTEGER NOT NULL DEFAULT 0,
  "stabilizationPressure" INTEGER NOT NULL DEFAULT 0,
  "monitoringPressure" INTEGER NOT NULL DEFAULT 0,
  "orchestrationPressure" INTEGER NOT NULL DEFAULT 0,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "recoveryPressure" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyPressure" INTEGER NOT NULL DEFAULT 0,
  "executiveUrgency" INTEGER NOT NULL DEFAULT 0,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "sectorSlug" TEXT,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relational_strategic_intelligence_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_intelligence_nodes_nodeCode_key" ON "relational_strategic_intelligence_nodes"("nodeCode");
CREATE INDEX "relational_strategic_intelligence_nodes_relationshipId_idx" ON "relational_strategic_intelligence_nodes"("relationshipId");
CREATE INDEX "relational_strategic_intelligence_nodes_strategicIntelligenceScore_idx" ON "relational_strategic_intelligence_nodes"("strategicIntelligenceScore");
CREATE INDEX "relational_strategic_intelligence_nodes_executiveExposure_idx" ON "relational_strategic_intelligence_nodes"("executiveExposure");
CREATE INDEX "relational_strategic_intelligence_nodes_resilienceStrength_idx" ON "relational_strategic_intelligence_nodes"("resilienceStrength");
CREATE INDEX "relational_strategic_intelligence_nodes_systemicConcentration_idx" ON "relational_strategic_intelligence_nodes"("systemicConcentration");
CREATE INDEX "relational_strategic_intelligence_nodes_territoryCountry_idx" ON "relational_strategic_intelligence_nodes"("territoryCountry");
CREATE INDEX "relational_strategic_intelligence_nodes_sectorSlug_idx" ON "relational_strategic_intelligence_nodes"("sectorSlug");
CREATE INDEX "relational_strategic_intelligence_nodes_intelligencePriority_idx" ON "relational_strategic_intelligence_nodes"("intelligencePriority");
CREATE INDEX "relational_strategic_intelligence_nodes_createdAt_idx" ON "relational_strategic_intelligence_nodes"("createdAt");

CREATE TABLE "relational_strategic_intelligence_signals" (
  "id" UUID NOT NULL,
  "intelligenceNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalStrategicIntelligenceSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_intelligence_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_intelligence_signals_signalCode_key" ON "relational_strategic_intelligence_signals"("signalCode");
CREATE INDEX "relational_strategic_intelligence_signals_intelligenceNodeId_idx" ON "relational_strategic_intelligence_signals"("intelligenceNodeId");
CREATE INDEX "relational_strategic_intelligence_signals_relationshipId_idx" ON "relational_strategic_intelligence_signals"("relationshipId");
CREATE INDEX "relational_strategic_intelligence_signals_signalType_idx" ON "relational_strategic_intelligence_signals"("signalType");

CREATE TABLE "relational_strategic_intelligence_syntheses" (
  "id" UUID NOT NULL,
  "intelligenceNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "synthesisCode" TEXT NOT NULL,
  "synthesisType" "RelationalStrategicIntelligenceSynthesisType" NOT NULL,
  "severity" "RelationalStrategicIntelligenceSeverity" NOT NULL,
  "priority" "RelationalStrategicIntelligencePriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "systemicConcentration" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_intelligence_syntheses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_intelligence_syntheses_synthesisCode_key" ON "relational_strategic_intelligence_syntheses"("synthesisCode");
CREATE INDEX "relational_strategic_intelligence_syntheses_intelligenceNodeId_idx" ON "relational_strategic_intelligence_syntheses"("intelligenceNodeId");
CREATE INDEX "relational_strategic_intelligence_syntheses_relationshipId_idx" ON "relational_strategic_intelligence_syntheses"("relationshipId");
CREATE INDEX "relational_strategic_intelligence_syntheses_synthesisType_idx" ON "relational_strategic_intelligence_syntheses"("synthesisType");
CREATE INDEX "relational_strategic_intelligence_syntheses_severity_idx" ON "relational_strategic_intelligence_syntheses"("severity");

CREATE TABLE "relational_strategic_intelligence_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "intelligenceNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "intelligenceStatus" "RelationalStrategicIntelligenceStatus" NOT NULL,
  "strategicIntelligenceScore" INTEGER NOT NULL,
  "executiveExposure" INTEGER NOT NULL,
  "resilienceStrength" INTEGER NOT NULL,
  "systemicConcentration" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_intelligence_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_intelligence_snapshots_snapshotCode_key" ON "relational_strategic_intelligence_snapshots"("snapshotCode");
CREATE INDEX "relational_strategic_intelligence_snapshots_relationshipId_idx" ON "relational_strategic_intelligence_snapshots"("relationshipId");
CREATE INDEX "relational_strategic_intelligence_snapshots_strategicIntelligenceScore_idx" ON "relational_strategic_intelligence_snapshots"("strategicIntelligenceScore");
CREATE INDEX "relational_strategic_intelligence_snapshots_createdAt_idx" ON "relational_strategic_intelligence_snapshots"("createdAt");

CREATE TABLE "relational_strategic_intelligence_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "intelligenceNodeId" UUID,
  "eventType" "RelationalStrategicIntelligenceEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_intelligence_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_strategic_intelligence_events_relationshipId_idx" ON "relational_strategic_intelligence_events"("relationshipId");
CREATE INDEX "relational_strategic_intelligence_events_intelligenceNodeId_idx" ON "relational_strategic_intelligence_events"("intelligenceNodeId");
CREATE INDEX "relational_strategic_intelligence_events_eventType_idx" ON "relational_strategic_intelligence_events"("eventType");
CREATE INDEX "relational_strategic_intelligence_events_createdAt_idx" ON "relational_strategic_intelligence_events"("createdAt");

ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_institutionalReportingNodeId_fkey" FOREIGN KEY ("institutionalReportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_executiveOrchestrationNodeId_fkey" FOREIGN KEY ("executiveOrchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_nodes" ADD CONSTRAINT "relational_strategic_intelligence_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_intelligence_signals" ADD CONSTRAINT "relational_strategic_intelligence_signals_intelligenceNodeId_fkey" FOREIGN KEY ("intelligenceNodeId") REFERENCES "relational_strategic_intelligence_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_signals" ADD CONSTRAINT "relational_strategic_intelligence_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_intelligence_syntheses" ADD CONSTRAINT "relational_strategic_intelligence_syntheses_intelligenceNodeId_fkey" FOREIGN KEY ("intelligenceNodeId") REFERENCES "relational_strategic_intelligence_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_syntheses" ADD CONSTRAINT "relational_strategic_intelligence_syntheses_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_intelligence_snapshots" ADD CONSTRAINT "relational_strategic_intelligence_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_snapshots" ADD CONSTRAINT "relational_strategic_intelligence_snapshots_intelligenceNodeId_fkey" FOREIGN KEY ("intelligenceNodeId") REFERENCES "relational_strategic_intelligence_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_intelligence_events" ADD CONSTRAINT "relational_strategic_intelligence_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_intelligence_events" ADD CONSTRAINT "relational_strategic_intelligence_events_intelligenceNodeId_fkey" FOREIGN KEY ("intelligenceNodeId") REFERENCES "relational_strategic_intelligence_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
