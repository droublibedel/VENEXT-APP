-- Instruction 20.41 — Relational Global Executive Supervision & Strategic Master Coordination Layer

CREATE TYPE "RelationalGlobalExecutiveSupervisionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalGlobalExecutiveSupervisionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalGlobalExecutiveSupervisionType" AS ENUM (
  'SUPERVISION_OVERVIEW',
  'GLOBAL_EXECUTIVE_CONSOLIDATION',
  'SYSTEMIC_EXPOSURE',
  'NETWORK_SUPERVISION'
);
CREATE TYPE "RelationalGlobalExecutiveSupervisionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalGlobalExecutiveSupervisionSignalType" AS ENUM (
  'SUPERVISION',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'BALANCE'
);
CREATE TYPE "RelationalGlobalExecutiveSupervisionMatrixType" AS ENUM (
  'GLOBAL_EXECUTIVE_SUPERVISION_MATRIX',
  'STRATEGIC_NETWORK_MATRIX',
  'SYSTEMIC_PRESSURE_MATRIX',
  'TERRITORIAL_SUPERVISION_MATRIX',
  'SECTOR_SUPERVISION_MATRIX',
  'RESILIENCE_SUPERVISION_MATRIX',
  'EXECUTIVE_BALANCE_MATRIX'
);
CREATE TYPE "RelationalGlobalExecutiveSupervisionEventType" AS ENUM (
  'MATRIX_GENERATED',
  'EXECUTIVE_PRESSURE_DETECTED',
  'SYSTEMIC_EXPOSURE_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_global_executive_supervision_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
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
  "supervisionType" "RelationalGlobalExecutiveSupervisionType" NOT NULL,
  "supervisionPriority" "RelationalGlobalExecutiveSupervisionPriority" NOT NULL,
  "supervisionStatus" "RelationalGlobalExecutiveSupervisionStatus" NOT NULL,
  "severity" "RelationalGlobalExecutiveSupervisionSeverity" NOT NULL,
  "supervisionScore" INTEGER NOT NULL DEFAULT 0,
  "executivePressure" INTEGER NOT NULL DEFAULT 0,
  "systemicExposure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_global_executive_supervision_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_global_executive_supervision_nodes_nodeCode_key" ON "relational_global_executive_supervision_nodes"("nodeCode");
CREATE INDEX "relational_global_executive_supervision_nodes_relationshipId_idx" ON "relational_global_executive_supervision_nodes"("relationshipId");
CREATE INDEX "relational_global_executive_supervision_nodes_supervisionScore_idx" ON "relational_global_executive_supervision_nodes"("supervisionScore");
CREATE INDEX "relational_global_executive_supervision_nodes_executivePressure_idx" ON "relational_global_executive_supervision_nodes"("executivePressure");
CREATE INDEX "relational_global_executive_supervision_nodes_systemicExposure_idx" ON "relational_global_executive_supervision_nodes"("systemicExposure");
CREATE INDEX "relational_global_executive_supervision_nodes_resilienceStrength_idx" ON "relational_global_executive_supervision_nodes"("resilienceStrength");
CREATE INDEX "relational_global_executive_supervision_nodes_territoryCountry_idx" ON "relational_global_executive_supervision_nodes"("territoryCountry");
CREATE INDEX "relational_global_executive_supervision_nodes_sectorSlug_idx" ON "relational_global_executive_supervision_nodes"("sectorSlug");
CREATE INDEX "relational_global_executive_supervision_nodes_supervisionPriority_idx" ON "relational_global_executive_supervision_nodes"("supervisionPriority");
CREATE INDEX "relational_global_executive_supervision_nodes_createdAt_idx" ON "relational_global_executive_supervision_nodes"("createdAt");

ALTER TABLE "relational_global_executive_supervision_nodes" ADD CONSTRAINT "relational_global_executive_supervision_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_global_executive_supervision_nodes" ADD CONSTRAINT "relational_global_executive_supervision_nodes_executiveStrategicSynthesisNodeId_fkey" FOREIGN KEY ("executiveStrategicSynthesisNodeId") REFERENCES "relational_executive_strategic_synthesis_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_global_executive_supervision_nodes" ADD CONSTRAINT "relational_global_executive_supervision_nodes_executiveControlRoomNodeId_fkey" FOREIGN KEY ("executiveControlRoomNodeId") REFERENCES "relational_executive_control_room_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_global_executive_supervision_nodes" ADD CONSTRAINT "relational_global_executive_supervision_nodes_executiveOperationsNodeId_fkey" FOREIGN KEY ("executiveOperationsNodeId") REFERENCES "relational_executive_operations_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "relational_global_executive_supervision_signals" (
  "id" UUID NOT NULL,
  "globalExecutiveSupervisionNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalGlobalExecutiveSupervisionSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_global_executive_supervision_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_global_executive_supervision_signals_signalCode_key" ON "relational_global_executive_supervision_signals"("signalCode");
CREATE INDEX "relational_global_executive_supervision_signals_globalExecutiveSupervisionNodeId_idx" ON "relational_global_executive_supervision_signals"("globalExecutiveSupervisionNodeId");
ALTER TABLE "relational_global_executive_supervision_signals" ADD CONSTRAINT "relational_global_executive_supervision_signals_globalExecutiveSupervisionNodeId_fkey" FOREIGN KEY ("globalExecutiveSupervisionNodeId") REFERENCES "relational_global_executive_supervision_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_global_executive_supervision_signals" ADD CONSTRAINT "relational_global_executive_supervision_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_global_executive_supervision_matrices" (
  "id" UUID NOT NULL,
  "globalExecutiveSupervisionNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "matrixCode" TEXT NOT NULL,
  "matrixType" "RelationalGlobalExecutiveSupervisionMatrixType" NOT NULL,
  "severity" "RelationalGlobalExecutiveSupervisionSeverity" NOT NULL,
  "priority" "RelationalGlobalExecutiveSupervisionPriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "executivePressure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_global_executive_supervision_matrices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_global_executive_supervision_matrices_matrixCode_key" ON "relational_global_executive_supervision_matrices"("matrixCode");
ALTER TABLE "relational_global_executive_supervision_matrices" ADD CONSTRAINT "relational_global_executive_supervision_matrices_globalExecutiveSupervisionNodeId_fkey" FOREIGN KEY ("globalExecutiveSupervisionNodeId") REFERENCES "relational_global_executive_supervision_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_global_executive_supervision_matrices" ADD CONSTRAINT "relational_global_executive_supervision_matrices_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_global_executive_supervision_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "globalExecutiveSupervisionNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "supervisionStatus" "RelationalGlobalExecutiveSupervisionStatus" NOT NULL,
  "supervisionScore" INTEGER NOT NULL,
  "executivePressure" INTEGER NOT NULL,
  "systemicExposure" INTEGER NOT NULL,
  "resilienceStrength" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_global_executive_supervision_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_global_executive_supervision_snapshots_snapshotCode_key" ON "relational_global_executive_supervision_snapshots"("snapshotCode");
ALTER TABLE "relational_global_executive_supervision_snapshots" ADD CONSTRAINT "relational_global_executive_supervision_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_global_executive_supervision_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "globalExecutiveSupervisionNodeId" UUID,
  "eventType" "RelationalGlobalExecutiveSupervisionEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_global_executive_supervision_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "relational_global_executive_supervision_events" ADD CONSTRAINT "relational_global_executive_supervision_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
