-- Instruction 20.42 — Relational Strategic Economic Observatory

CREATE TYPE "RelationalStrategicObservatorySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalStrategicObservatoryStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalStrategicObservatoryType" AS ENUM (
  'OBSERVATORY_OVERVIEW',
  'MACRO_COORDINATION',
  'SYSTEMIC_CONCENTRATION',
  'NETWORK_COORDINATION'
);
CREATE TYPE "RelationalStrategicObservatoryPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalStrategicObservatorySignalType" AS ENUM (
  'OBSERVATORY',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'BALANCE'
);
CREATE TYPE "RelationalStrategicObservatoryGridType" AS ENUM (
  'GLOBAL_STRATEGIC_OBSERVATORY_GRID',
  'EXECUTIVE_PRESSURE_GRID',
  'SYSTEMIC_CONCENTRATION_GRID',
  'TERRITORIAL_COORDINATION_GRID',
  'SECTOR_COORDINATION_GRID',
  'RESILIENCE_COORDINATION_GRID',
  'EXECUTIVE_ALIGNMENT_GRID'
);
CREATE TYPE "RelationalStrategicObservatoryEventType" AS ENUM (
  'GRID_GENERATED',
  'EXECUTIVE_PRESSURE_DETECTED',
  'SYSTEMIC_CONCENTRATION_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_strategic_observatory_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "globalExecutiveSupervisionNodeId" UUID,
  "executiveStrategicSynthesisNodeId" UUID,
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
  "observatoryType" "RelationalStrategicObservatoryType" NOT NULL,
  "observatoryPriority" "RelationalStrategicObservatoryPriority" NOT NULL,
  "observatoryStatus" "RelationalStrategicObservatoryStatus" NOT NULL,
  "severity" "RelationalStrategicObservatorySeverity" NOT NULL,
  "observatoryScore" INTEGER NOT NULL DEFAULT 0,
  "executiveExposure" INTEGER NOT NULL DEFAULT 0,
  "systemicPressure" INTEGER NOT NULL DEFAULT 0,
  "resilienceStrength" INTEGER NOT NULL DEFAULT 0,
  "strategicCoordinationPressure" INTEGER NOT NULL DEFAULT 0,
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
  "synthesisPressure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_strategic_observatory_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_observatory_nodes_nodeCode_key" ON "relational_strategic_observatory_nodes"("nodeCode");
CREATE INDEX "relational_strategic_observatory_nodes_relationshipId_idx" ON "relational_strategic_observatory_nodes"("relationshipId");
CREATE INDEX "relational_strategic_observatory_nodes_observatoryScore_idx" ON "relational_strategic_observatory_nodes"("observatoryScore");
CREATE INDEX "relational_strategic_observatory_nodes_executiveExposure_idx" ON "relational_strategic_observatory_nodes"("executiveExposure");
CREATE INDEX "relational_strategic_observatory_nodes_systemicPressure_idx" ON "relational_strategic_observatory_nodes"("systemicPressure");
CREATE INDEX "relational_strategic_observatory_nodes_resilienceStrength_idx" ON "relational_strategic_observatory_nodes"("resilienceStrength");
CREATE INDEX "relational_strategic_observatory_nodes_territoryCountry_idx" ON "relational_strategic_observatory_nodes"("territoryCountry");
CREATE INDEX "relational_strategic_observatory_nodes_sectorSlug_idx" ON "relational_strategic_observatory_nodes"("sectorSlug");
CREATE INDEX "relational_strategic_observatory_nodes_observatoryPriority_idx" ON "relational_strategic_observatory_nodes"("observatoryPriority");
CREATE INDEX "relational_strategic_observatory_nodes_createdAt_idx" ON "relational_strategic_observatory_nodes"("createdAt");

ALTER TABLE "relational_strategic_observatory_nodes" ADD CONSTRAINT "relational_strategic_observatory_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_observatory_nodes" ADD CONSTRAINT "relational_strategic_observatory_nodes_globalExecutiveSupervisionNodeId_fkey" FOREIGN KEY ("globalExecutiveSupervisionNodeId") REFERENCES "relational_global_executive_supervision_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "relational_strategic_observatory_signals" (
  "id" UUID NOT NULL,
  "strategicObservatoryNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalStrategicObservatorySignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_observatory_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_observatory_signals_signalCode_key" ON "relational_strategic_observatory_signals"("signalCode");
ALTER TABLE "relational_strategic_observatory_signals" ADD CONSTRAINT "relational_strategic_observatory_signals_strategicObservatoryNodeId_fkey" FOREIGN KEY ("strategicObservatoryNodeId") REFERENCES "relational_strategic_observatory_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_observatory_signals" ADD CONSTRAINT "relational_strategic_observatory_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_strategic_observatory_grids" (
  "id" UUID NOT NULL,
  "strategicObservatoryNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "gridCode" TEXT NOT NULL,
  "gridType" "RelationalStrategicObservatoryGridType" NOT NULL,
  "severity" "RelationalStrategicObservatorySeverity" NOT NULL,
  "priority" "RelationalStrategicObservatoryPriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "executiveExposure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_observatory_grids_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_observatory_grids_gridCode_key" ON "relational_strategic_observatory_grids"("gridCode");
ALTER TABLE "relational_strategic_observatory_grids" ADD CONSTRAINT "relational_strategic_observatory_grids_strategicObservatoryNodeId_fkey" FOREIGN KEY ("strategicObservatoryNodeId") REFERENCES "relational_strategic_observatory_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_strategic_observatory_grids" ADD CONSTRAINT "relational_strategic_observatory_grids_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_strategic_observatory_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "strategicObservatoryNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "observatoryStatus" "RelationalStrategicObservatoryStatus" NOT NULL,
  "observatoryScore" INTEGER NOT NULL,
  "executiveExposure" INTEGER NOT NULL,
  "systemicPressure" INTEGER NOT NULL,
  "resilienceStrength" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_observatory_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_strategic_observatory_snapshots_snapshotCode_key" ON "relational_strategic_observatory_snapshots"("snapshotCode");
ALTER TABLE "relational_strategic_observatory_snapshots" ADD CONSTRAINT "relational_strategic_observatory_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_strategic_observatory_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "strategicObservatoryNodeId" UUID,
  "eventType" "RelationalStrategicObservatoryEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_strategic_observatory_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "relational_strategic_observatory_events" ADD CONSTRAINT "relational_strategic_observatory_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
