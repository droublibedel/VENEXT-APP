-- Instruction 20.36 — Relational Strategic Economic Intelligence Consolidation & Executive Grid

CREATE TYPE "RelationalStrategicCommandSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalStrategicCommandStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalStrategicCommandType" AS ENUM (
  'COMMAND_OVERVIEW',
  'EXECUTIVE_GRID_DIGEST',
  'NETWORK_OVERSIGHT',
  'SYSTEMIC_GRID'
);
CREATE TYPE "RelationalStrategicCommandPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalStrategicCommandSignalType" AS ENUM (
  'STRATEGIC',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'ALIGNMENT'
);
CREATE TYPE "RelationalStrategicCommandGridType" AS ENUM (
  'EXECUTIVE_GRID',
  'STRATEGIC_GRID',
  'TERRITORIAL_GRID',
  'SECTOR_GRID',
  'SYSTEMIC_GRID',
  'RESILIENCE_GRID',
  'GOVERNANCE_GRID'
);
CREATE TYPE "RelationalStrategicCommandEventType" AS ENUM (
  'GRID_GENERATED',
  'SYSTEMIC_PRESSURE_DETECTED',
  'EXECUTIVE_EXPOSURE_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_strategic_command_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
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
  "commandType" "RelationalStrategicCommandType" NOT NULL,
  "commandPriority" "RelationalStrategicCommandPriority" NOT NULL,
  "commandStatus" "RelationalStrategicCommandStatus" NOT NULL,
  "severity" "RelationalStrategicCommandSeverity" NOT NULL,
  "commandScore" INTEGER NOT NULL DEFAULT 0,
  "executiveConcentration" INTEGER NOT NULL DEFAULT 0,
  "resilienceStrength" INTEGER NOT NULL DEFAULT 0,
  "systemicPressure" INTEGER NOT NULL DEFAULT 0,
  "strategicBalanceScore" INTEGER NOT NULL DEFAULT 0,
  "governancePressure" INTEGER NOT NULL DEFAULT 0,
  "arbitrationPressure" INTEGER NOT NULL DEFAULT 0,
  "stabilizationPressure" INTEGER NOT NULL DEFAULT 0,
  "monitoringPressure" INTEGER NOT NULL DEFAULT 0,
  "orchestrationPressure" INTEGER NOT NULL DEFAULT 0,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "intelligencePressure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_strategic_command_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_command_nodes_nodeCode_key" ON "relational_strategic_command_nodes"("nodeCode");
CREATE INDEX "relational_strategic_command_nodes_relationshipId_idx" ON "relational_strategic_command_nodes"("relationshipId");
CREATE INDEX "relational_strategic_command_nodes_commandScore_idx" ON "relational_strategic_command_nodes"("commandScore");
CREATE INDEX "relational_strategic_command_nodes_executiveConcentration_idx" ON "relational_strategic_command_nodes"("executiveConcentration");
CREATE INDEX "relational_strategic_command_nodes_resilienceStrength_idx" ON "relational_strategic_command_nodes"("resilienceStrength");
CREATE INDEX "relational_strategic_command_nodes_systemicPressure_idx" ON "relational_strategic_command_nodes"("systemicPressure");
CREATE INDEX "relational_strategic_command_nodes_territoryCountry_idx" ON "relational_strategic_command_nodes"("territoryCountry");
CREATE INDEX "relational_strategic_command_nodes_sectorSlug_idx" ON "relational_strategic_command_nodes"("sectorSlug");
CREATE INDEX "relational_strategic_command_nodes_commandPriority_idx" ON "relational_strategic_command_nodes"("commandPriority");
CREATE INDEX "relational_strategic_command_nodes_createdAt_idx" ON "relational_strategic_command_nodes"("createdAt");

CREATE TABLE "relational_strategic_command_signals" (
  "id" UUID NOT NULL,
  "commandNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalStrategicCommandSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_command_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_command_signals_signalCode_key" ON "relational_strategic_command_signals"("signalCode");
CREATE INDEX "relational_strategic_command_signals_commandNodeId_idx" ON "relational_strategic_command_signals"("commandNodeId");
CREATE INDEX "relational_strategic_command_signals_relationshipId_idx" ON "relational_strategic_command_signals"("relationshipId");
CREATE INDEX "relational_strategic_command_signals_signalType_idx" ON "relational_strategic_command_signals"("signalType");

CREATE TABLE "relational_strategic_command_grids" (
  "id" UUID NOT NULL,
  "commandNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "gridCode" TEXT NOT NULL,
  "gridType" "RelationalStrategicCommandGridType" NOT NULL,
  "severity" "RelationalStrategicCommandSeverity" NOT NULL,
  "priority" "RelationalStrategicCommandPriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "systemicPressure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_command_grids_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_command_grids_gridCode_key" ON "relational_strategic_command_grids"("gridCode");
CREATE INDEX "relational_strategic_command_grids_commandNodeId_idx" ON "relational_strategic_command_grids"("commandNodeId");
CREATE INDEX "relational_strategic_command_grids_relationshipId_idx" ON "relational_strategic_command_grids"("relationshipId");
CREATE INDEX "relational_strategic_command_grids_gridType_idx" ON "relational_strategic_command_grids"("gridType");
CREATE INDEX "relational_strategic_command_grids_severity_idx" ON "relational_strategic_command_grids"("severity");

CREATE TABLE "relational_strategic_command_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "commandNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "commandStatus" "RelationalStrategicCommandStatus" NOT NULL,
  "commandScore" INTEGER NOT NULL,
  "executiveConcentration" INTEGER NOT NULL,
  "resilienceStrength" INTEGER NOT NULL,
  "systemicPressure" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_command_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_command_snapshots_snapshotCode_key" ON "relational_strategic_command_snapshots"("snapshotCode");
CREATE INDEX "relational_strategic_command_snapshots_relationshipId_idx" ON "relational_strategic_command_snapshots"("relationshipId");
CREATE INDEX "relational_strategic_command_snapshots_commandScore_idx" ON "relational_strategic_command_snapshots"("commandScore");
CREATE INDEX "relational_strategic_command_snapshots_createdAt_idx" ON "relational_strategic_command_snapshots"("createdAt");

CREATE TABLE "relational_strategic_command_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "commandNodeId" UUID,
  "eventType" "RelationalStrategicCommandEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_command_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_strategic_command_events_relationshipId_idx" ON "relational_strategic_command_events"("relationshipId");
CREATE INDEX "relational_strategic_command_events_commandNodeId_idx" ON "relational_strategic_command_events"("commandNodeId");
CREATE INDEX "relational_strategic_command_events_eventType_idx" ON "relational_strategic_command_events"("eventType");
CREATE INDEX "relational_strategic_command_events_createdAt_idx" ON "relational_strategic_command_events"("createdAt");

ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_institutionalReportingNodeId_fkey" FOREIGN KEY ("institutionalReportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_executiveOrchestrationNodeId_fkey" FOREIGN KEY ("executiveOrchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_nodes" ADD CONSTRAINT "relational_strategic_command_nodes_strategicIntelligenceNodeId_fkey" FOREIGN KEY ("strategicIntelligenceNodeId") REFERENCES "relational_strategic_intelligence_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_command_signals" ADD CONSTRAINT "relational_strategic_command_signals_commandNodeId_fkey" FOREIGN KEY ("commandNodeId") REFERENCES "relational_strategic_command_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_signals" ADD CONSTRAINT "relational_strategic_command_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_command_grids" ADD CONSTRAINT "relational_strategic_command_grids_commandNodeId_fkey" FOREIGN KEY ("commandNodeId") REFERENCES "relational_strategic_command_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_grids" ADD CONSTRAINT "relational_strategic_command_grids_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_command_snapshots" ADD CONSTRAINT "relational_strategic_command_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_snapshots" ADD CONSTRAINT "relational_strategic_command_snapshots_commandNodeId_fkey" FOREIGN KEY ("commandNodeId") REFERENCES "relational_strategic_command_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_strategic_command_events" ADD CONSTRAINT "relational_strategic_command_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_command_events" ADD CONSTRAINT "relational_strategic_command_events_commandNodeId_fkey" FOREIGN KEY ("commandNodeId") REFERENCES "relational_strategic_command_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
