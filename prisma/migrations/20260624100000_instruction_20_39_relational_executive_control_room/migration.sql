-- Instruction 20.39 — Relational Executive Economic Control Room & Strategic Decision Board

CREATE TYPE "RelationalExecutiveControlRoomSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalExecutiveControlRoomStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalExecutiveControlRoomType" AS ENUM (
  'CONTROL_ROOM_OVERVIEW',
  'EXECUTIVE_SUPERVISION',
  'SYSTEMIC_BOARD',
  'NETWORK_OVERSIGHT'
);
CREATE TYPE "RelationalExecutiveControlRoomPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalExecutiveControlRoomSignalType" AS ENUM (
  'CONTROL',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'BALANCE'
);
CREATE TYPE "RelationalExecutiveControlRoomBoardType" AS ENUM (
  'EXECUTIVE_DECISION_BOARD',
  'STRATEGIC_COMMAND_BOARD',
  'SYSTEMIC_PRESSURE_BOARD',
  'TERRITORIAL_SUPERVISION_BOARD',
  'SECTOR_SUPERVISION_BOARD',
  'RESILIENCE_SUPERVISION_BOARD',
  'EXECUTIVE_BALANCE_BOARD'
);
CREATE TYPE "RelationalExecutiveControlRoomEventType" AS ENUM (
  'BOARD_GENERATED',
  'EXECUTIVE_PRESSURE_DETECTED',
  'SYSTEMIC_CONCENTRATION_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_executive_control_room_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
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
  "controlRoomType" "RelationalExecutiveControlRoomType" NOT NULL,
  "boardPriority" "RelationalExecutiveControlRoomPriority" NOT NULL,
  "controlRoomStatus" "RelationalExecutiveControlRoomStatus" NOT NULL,
  "severity" "RelationalExecutiveControlRoomSeverity" NOT NULL,
  "controlRoomScore" INTEGER NOT NULL DEFAULT 0,
  "executivePressure" INTEGER NOT NULL DEFAULT 0,
  "systemicConcentration" INTEGER NOT NULL DEFAULT 0,
  "resilienceStrength" INTEGER NOT NULL DEFAULT 0,
  "strategicBalanceScore" INTEGER NOT NULL DEFAULT 0,
  "governancePressure" INTEGER NOT NULL DEFAULT 0,
  "arbitrationPressure" INTEGER NOT NULL DEFAULT 0,
  "stabilizationPressure" INTEGER NOT NULL DEFAULT 0,
  "monitoringPressure" INTEGER NOT NULL DEFAULT 0,
  "orchestrationPressure" INTEGER NOT NULL DEFAULT 0,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "intelligencePressure" INTEGER NOT NULL DEFAULT 0,
  "commandPressure" INTEGER NOT NULL DEFAULT 0,
  "operationsPressure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_executive_control_room_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_control_room_nodes_nodeCode_key" ON "relational_executive_control_room_nodes"("nodeCode");
CREATE INDEX "relational_executive_control_room_nodes_relationshipId_idx" ON "relational_executive_control_room_nodes"("relationshipId");
CREATE INDEX "relational_executive_control_room_nodes_controlRoomScore_idx" ON "relational_executive_control_room_nodes"("controlRoomScore");
CREATE INDEX "relational_executive_control_room_nodes_executivePressure_idx" ON "relational_executive_control_room_nodes"("executivePressure");
CREATE INDEX "relational_executive_control_room_nodes_systemicConcentration_idx" ON "relational_executive_control_room_nodes"("systemicConcentration");
CREATE INDEX "relational_executive_control_room_nodes_resilienceStrength_idx" ON "relational_executive_control_room_nodes"("resilienceStrength");
CREATE INDEX "relational_executive_control_room_nodes_territoryCountry_idx" ON "relational_executive_control_room_nodes"("territoryCountry");
CREATE INDEX "relational_executive_control_room_nodes_sectorSlug_idx" ON "relational_executive_control_room_nodes"("sectorSlug");
CREATE INDEX "relational_executive_control_room_nodes_boardPriority_idx" ON "relational_executive_control_room_nodes"("boardPriority");
CREATE INDEX "relational_executive_control_room_nodes_createdAt_idx" ON "relational_executive_control_room_nodes"("createdAt");

CREATE TABLE "relational_executive_control_room_signals" (
  "id" UUID NOT NULL,
  "controlRoomNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalExecutiveControlRoomSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_control_room_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_control_room_signals_signalCode_key" ON "relational_executive_control_room_signals"("signalCode");
CREATE INDEX "relational_executive_control_room_signals_controlRoomNodeId_idx" ON "relational_executive_control_room_signals"("controlRoomNodeId");
CREATE INDEX "relational_executive_control_room_signals_relationshipId_idx" ON "relational_executive_control_room_signals"("relationshipId");
CREATE INDEX "relational_executive_control_room_signals_signalType_idx" ON "relational_executive_control_room_signals"("signalType");

CREATE TABLE "relational_executive_control_room_boards" (
  "id" UUID NOT NULL,
  "controlRoomNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "boardCode" TEXT NOT NULL,
  "boardType" "RelationalExecutiveControlRoomBoardType" NOT NULL,
  "severity" "RelationalExecutiveControlRoomSeverity" NOT NULL,
  "priority" "RelationalExecutiveControlRoomPriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "executivePressure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_control_room_boards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_control_room_boards_boardCode_key" ON "relational_executive_control_room_boards"("boardCode");
CREATE INDEX "relational_executive_control_room_boards_controlRoomNodeId_idx" ON "relational_executive_control_room_boards"("controlRoomNodeId");
CREATE INDEX "relational_executive_control_room_boards_relationshipId_idx" ON "relational_executive_control_room_boards"("relationshipId");
CREATE INDEX "relational_executive_control_room_boards_boardType_idx" ON "relational_executive_control_room_boards"("boardType");
CREATE INDEX "relational_executive_control_room_boards_severity_idx" ON "relational_executive_control_room_boards"("severity");

CREATE TABLE "relational_executive_control_room_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "controlRoomNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "controlRoomStatus" "RelationalExecutiveControlRoomStatus" NOT NULL,
  "controlRoomScore" INTEGER NOT NULL,
  "executivePressure" INTEGER NOT NULL,
  "systemicConcentration" INTEGER NOT NULL,
  "resilienceStrength" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_control_room_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_control_room_snapshots_snapshotCode_key" ON "relational_executive_control_room_snapshots"("snapshotCode");
CREATE INDEX "relational_executive_control_room_snapshots_relationshipId_idx" ON "relational_executive_control_room_snapshots"("relationshipId");
CREATE INDEX "relational_executive_control_room_snapshots_controlRoomScore_idx" ON "relational_executive_control_room_snapshots"("controlRoomScore");
CREATE INDEX "relational_executive_control_room_snapshots_executivePressure_idx" ON "relational_executive_control_room_snapshots"("executivePressure");
CREATE INDEX "relational_executive_control_room_snapshots_systemicConcentration_idx" ON "relational_executive_control_room_snapshots"("systemicConcentration");
CREATE INDEX "relational_executive_control_room_snapshots_resilienceStrength_idx" ON "relational_executive_control_room_snapshots"("resilienceStrength");
CREATE INDEX "relational_executive_control_room_snapshots_createdAt_idx" ON "relational_executive_control_room_snapshots"("createdAt");

CREATE TABLE "relational_executive_control_room_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "controlRoomNodeId" UUID,
  "eventType" "RelationalExecutiveControlRoomEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_control_room_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_executive_control_room_events_relationshipId_idx" ON "relational_executive_control_room_events"("relationshipId");
CREATE INDEX "relational_executive_control_room_events_controlRoomNodeId_idx" ON "relational_executive_control_room_events"("controlRoomNodeId");
CREATE INDEX "relational_executive_control_room_events_eventType_idx" ON "relational_executive_control_room_events"("eventType");
CREATE INDEX "relational_executive_control_room_events_createdAt_idx" ON "relational_executive_control_room_events"("createdAt");

ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_executiveOperationsNodeId_fkey" FOREIGN KEY ("executiveOperationsNodeId") REFERENCES "relational_executive_operations_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_strategicCommandNodeId_fkey" FOREIGN KEY ("strategicCommandNodeId") REFERENCES "relational_strategic_command_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_strategicIntelligenceNodeId_fkey" FOREIGN KEY ("strategicIntelligenceNodeId") REFERENCES "relational_strategic_intelligence_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_institutionalReportingNodeId_fkey" FOREIGN KEY ("institutionalReportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_executiveOrchestrationNodeId_fkey" FOREIGN KEY ("executiveOrchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_nodes" ADD CONSTRAINT "relational_executive_control_room_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_executive_control_room_signals" ADD CONSTRAINT "relational_executive_control_room_signals_controlRoomNodeId_fkey" FOREIGN KEY ("controlRoomNodeId") REFERENCES "relational_executive_control_room_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_signals" ADD CONSTRAINT "relational_executive_control_room_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_executive_control_room_boards" ADD CONSTRAINT "relational_executive_control_room_boards_controlRoomNodeId_fkey" FOREIGN KEY ("controlRoomNodeId") REFERENCES "relational_executive_control_room_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_boards" ADD CONSTRAINT "relational_executive_control_room_boards_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_executive_control_room_snapshots" ADD CONSTRAINT "relational_executive_control_room_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_snapshots" ADD CONSTRAINT "relational_executive_control_room_snapshots_controlRoomNodeId_fkey" FOREIGN KEY ("controlRoomNodeId") REFERENCES "relational_executive_control_room_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_executive_control_room_events" ADD CONSTRAINT "relational_executive_control_room_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_control_room_events" ADD CONSTRAINT "relational_executive_control_room_events_controlRoomNodeId_fkey" FOREIGN KEY ("controlRoomNodeId") REFERENCES "relational_executive_control_room_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
