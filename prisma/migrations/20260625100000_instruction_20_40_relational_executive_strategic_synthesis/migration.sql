-- Instruction 20.40 — Relational Executive Strategic Synthesis & Global Oversight Consolidation

CREATE TYPE "RelationalExecutiveStrategicSynthesisSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalExecutiveStrategicSynthesisStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalExecutiveStrategicSynthesisType" AS ENUM (
  'SYNTHESIS_OVERVIEW',
  'EXECUTIVE_CONSOLIDATION',
  'SYSTEMIC_PRESSURE',
  'NETWORK_OVERSIGHT'
);
CREATE TYPE "RelationalExecutiveStrategicSynthesisPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalExecutiveStrategicSynthesisSignalType" AS ENUM (
  'SYNTHESIS',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'BALANCE'
);
CREATE TYPE "RelationalExecutiveStrategicSynthesisDigestType" AS ENUM (
  'EXECUTIVE_SYNTHESIS_DIGEST',
  'STRATEGIC_ALIGNMENT_DIGEST',
  'SYSTEMIC_PRESSURE_DIGEST',
  'TERRITORIAL_OVERSIGHT_DIGEST',
  'SECTOR_OVERSIGHT_DIGEST',
  'RESILIENCE_SYNTHESIS_DIGEST',
  'EXECUTIVE_BALANCE_DIGEST'
);
CREATE TYPE "RelationalExecutiveStrategicSynthesisEventType" AS ENUM (
  'DIGEST_GENERATED',
  'EXECUTIVE_EXPOSURE_DETECTED',
  'SYSTEMIC_PRESSURE_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_executive_strategic_synthesis_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "executiveControlRoomNodeId" UUID,
  "executiveOperationsNodeId" UUID,
  "strategicCommandNodeId" UUID,
  "strategicIntelligenceNodeId" UUID,
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
  "synthesisType" "RelationalExecutiveStrategicSynthesisType" NOT NULL,
  "synthesisPriority" "RelationalExecutiveStrategicSynthesisPriority" NOT NULL,
  "synthesisStatus" "RelationalExecutiveStrategicSynthesisStatus" NOT NULL,
  "severity" "RelationalExecutiveStrategicSynthesisSeverity" NOT NULL,
  "synthesisScore" INTEGER NOT NULL DEFAULT 0,
  "executiveExposure" INTEGER NOT NULL DEFAULT 0,
  "systemicPressure" INTEGER NOT NULL DEFAULT 0,
  "resilienceStrength" INTEGER NOT NULL DEFAULT 0,
  "strategicAlignmentScore" INTEGER NOT NULL DEFAULT 0,
  "governancePressure" INTEGER NOT NULL DEFAULT 0,
  "arbitrationPressure" INTEGER NOT NULL DEFAULT 0,
  "stabilizationPressure" INTEGER NOT NULL DEFAULT 0,
  "monitoringPressure" INTEGER NOT NULL DEFAULT 0,
  "orchestrationPressure" INTEGER NOT NULL DEFAULT 0,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "intelligencePressure" INTEGER NOT NULL DEFAULT 0,
  "commandPressure" INTEGER NOT NULL DEFAULT 0,
  "operationsPressure" INTEGER NOT NULL DEFAULT 0,
  "controlRoomPressure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_executive_strategic_synthesis_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_strategic_synthesis_nodes_nodeCode_key" ON "relational_executive_strategic_synthesis_nodes"("nodeCode");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_relationshipId_idx" ON "relational_executive_strategic_synthesis_nodes"("relationshipId");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_synthesisScore_idx" ON "relational_executive_strategic_synthesis_nodes"("synthesisScore");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_executiveExposure_idx" ON "relational_executive_strategic_synthesis_nodes"("executiveExposure");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_systemicPressure_idx" ON "relational_executive_strategic_synthesis_nodes"("systemicPressure");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_resilienceStrength_idx" ON "relational_executive_strategic_synthesis_nodes"("resilienceStrength");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_territoryCountry_idx" ON "relational_executive_strategic_synthesis_nodes"("territoryCountry");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_sectorSlug_idx" ON "relational_executive_strategic_synthesis_nodes"("sectorSlug");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_synthesisPriority_idx" ON "relational_executive_strategic_synthesis_nodes"("synthesisPriority");
CREATE INDEX "relational_executive_strategic_synthesis_nodes_createdAt_idx" ON "relational_executive_strategic_synthesis_nodes"("createdAt");

CREATE TABLE "relational_executive_strategic_synthesis_signals" (
  "id" UUID NOT NULL,
  "strategicSynthesisNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalExecutiveStrategicSynthesisSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_strategic_synthesis_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_strategic_synthesis_signals_signalCode_key" ON "relational_executive_strategic_synthesis_signals"("signalCode");
CREATE INDEX "relational_executive_strategic_synthesis_signals_strategicSynthesisNodeId_idx" ON "relational_executive_strategic_synthesis_signals"("strategicSynthesisNodeId");
CREATE INDEX "relational_executive_strategic_synthesis_signals_relationshipId_idx" ON "relational_executive_strategic_synthesis_signals"("relationshipId");
CREATE INDEX "relational_executive_strategic_synthesis_signals_signalType_idx" ON "relational_executive_strategic_synthesis_signals"("signalType");

CREATE TABLE "relational_executive_strategic_synthesis_digests" (
  "id" UUID NOT NULL,
  "strategicSynthesisNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "digestCode" TEXT NOT NULL,
  "digestType" "RelationalExecutiveStrategicSynthesisDigestType" NOT NULL,
  "severity" "RelationalExecutiveStrategicSynthesisSeverity" NOT NULL,
  "priority" "RelationalExecutiveStrategicSynthesisPriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "executiveExposure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_strategic_synthesis_digests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_strategic_synthesis_digests_digestCode_key" ON "relational_executive_strategic_synthesis_digests"("digestCode");
CREATE INDEX "relational_executive_strategic_synthesis_digests_strategicSynthesisNodeId_idx" ON "relational_executive_strategic_synthesis_digests"("strategicSynthesisNodeId");
CREATE INDEX "relational_executive_strategic_synthesis_digests_relationshipId_idx" ON "relational_executive_strategic_synthesis_digests"("relationshipId");
CREATE INDEX "relational_executive_strategic_synthesis_digests_digestType_idx" ON "relational_executive_strategic_synthesis_digests"("digestType");
CREATE INDEX "relational_executive_strategic_synthesis_digests_severity_idx" ON "relational_executive_strategic_synthesis_digests"("severity");

CREATE TABLE "relational_executive_strategic_synthesis_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "strategicSynthesisNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "synthesisStatus" "RelationalExecutiveStrategicSynthesisStatus" NOT NULL,
  "synthesisScore" INTEGER NOT NULL,
  "executiveExposure" INTEGER NOT NULL,
  "systemicPressure" INTEGER NOT NULL,
  "resilienceStrength" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_strategic_synthesis_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_strategic_synthesis_snapshots_snapshotCode_key" ON "relational_executive_strategic_synthesis_snapshots"("snapshotCode");
CREATE INDEX "relational_executive_strategic_synthesis_snapshots_relationshipId_idx" ON "relational_executive_strategic_synthesis_snapshots"("relationshipId");
CREATE INDEX "relational_executive_strategic_synthesis_snapshots_synthesisScore_idx" ON "relational_executive_strategic_synthesis_snapshots"("synthesisScore");
CREATE INDEX "relational_executive_strategic_synthesis_snapshots_executiveExposure_idx" ON "relational_executive_strategic_synthesis_snapshots"("executiveExposure");
CREATE INDEX "relational_executive_strategic_synthesis_snapshots_systemicPressure_idx" ON "relational_executive_strategic_synthesis_snapshots"("systemicPressure");
CREATE INDEX "relational_executive_strategic_synthesis_snapshots_resilienceStrength_idx" ON "relational_executive_strategic_synthesis_snapshots"("resilienceStrength");
CREATE INDEX "relational_executive_strategic_synthesis_snapshots_createdAt_idx" ON "relational_executive_strategic_synthesis_snapshots"("createdAt");

CREATE TABLE "relational_executive_strategic_synthesis_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "strategicSynthesisNodeId" UUID,
  "eventType" "RelationalExecutiveStrategicSynthesisEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_strategic_synthesis_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_executive_strategic_synthesis_events_relationshipId_idx" ON "relational_executive_strategic_synthesis_events"("relationshipId");
CREATE INDEX "relational_executive_strategic_synthesis_events_strategicSynthesisNodeId_idx" ON "relational_executive_strategic_synthesis_events"("strategicSynthesisNodeId");
CREATE INDEX "relational_executive_strategic_synthesis_events_eventType_idx" ON "relational_executive_strategic_synthesis_events"("eventType");
CREATE INDEX "relational_executive_strategic_synthesis_events_createdAt_idx" ON "relational_executive_strategic_synthesis_events"("createdAt");

ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_executiveControlRoomNodeId_fkey" FOREIGN KEY ("executiveControlRoomNodeId") REFERENCES "relational_executive_control_room_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_executiveOperationsNodeId_fkey" FOREIGN KEY ("executiveOperationsNodeId") REFERENCES "relational_executive_operations_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_strategicCommandNodeId_fkey" FOREIGN KEY ("strategicCommandNodeId") REFERENCES "relational_strategic_command_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_strategicIntelligenceNodeId_fkey" FOREIGN KEY ("strategicIntelligenceNodeId") REFERENCES "relational_strategic_intelligence_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_institutionalReportingNodeId_fkey" FOREIGN KEY ("institutionalReportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_executiveOrchestrationNodeId_fkey" FOREIGN KEY ("executiveOrchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_nodes" ADD CONSTRAINT "relational_executive_strategic_synthesis_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_executive_strategic_synthesis_signals" ADD CONSTRAINT "relational_executive_strategic_synthesis_signals_strategicSynthesisNodeId_fkey" FOREIGN KEY ("strategicSynthesisNodeId") REFERENCES "relational_executive_strategic_synthesis_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_signals" ADD CONSTRAINT "relational_executive_strategic_synthesis_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_executive_strategic_synthesis_digests" ADD CONSTRAINT "relational_executive_strategic_synthesis_digests_strategicSynthesisNodeId_fkey" FOREIGN KEY ("strategicSynthesisNodeId") REFERENCES "relational_executive_strategic_synthesis_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_digests" ADD CONSTRAINT "relational_executive_strategic_synthesis_digests_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_executive_strategic_synthesis_snapshots" ADD CONSTRAINT "relational_executive_strategic_synthesis_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_snapshots" ADD CONSTRAINT "relational_executive_strategic_synthesis_snapshots_strategicSynthesisNodeId_fkey" FOREIGN KEY ("strategicSynthesisNodeId") REFERENCES "relational_executive_strategic_synthesis_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_executive_strategic_synthesis_events" ADD CONSTRAINT "relational_executive_strategic_synthesis_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_strategic_synthesis_events" ADD CONSTRAINT "relational_executive_strategic_synthesis_events_strategicSynthesisNodeId_fkey" FOREIGN KEY ("strategicSynthesisNodeId") REFERENCES "relational_executive_strategic_synthesis_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
