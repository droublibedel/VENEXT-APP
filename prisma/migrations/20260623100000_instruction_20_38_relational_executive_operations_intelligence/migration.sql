-- Instruction 20.38 — Relational Strategic Executive Operations Intelligence

CREATE TYPE "RelationalExecutiveOperationsSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalExecutiveOperationsStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalExecutiveOperationsType" AS ENUM (
  'OPERATIONS_OVERVIEW',
  'EXECUTIVE_SUPERVISION',
  'SYSTEMIC_MATRIX',
  'NETWORK_OVERSIGHT'
);
CREATE TYPE "RelationalExecutiveOperationsPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalExecutiveOperationsSignalType" AS ENUM (
  'OPERATIONS',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'BALANCE'
);
CREATE TYPE "RelationalExecutiveOperationsMatrixType" AS ENUM (
  'EXECUTIVE_OPERATIONS_MATRIX',
  'STRATEGIC_SUPERVISION_MATRIX',
  'SYSTEMIC_CONCENTRATION_MATRIX',
  'TERRITORIAL_OPERATIONS_MATRIX',
  'SECTOR_OPERATIONS_MATRIX',
  'RESILIENCE_OPERATIONS_MATRIX',
  'EXECUTIVE_BALANCE_MATRIX'
);
CREATE TYPE "RelationalExecutiveOperationsEventType" AS ENUM (
  'MATRIX_GENERATED',
  'EXECUTIVE_PRESSURE_DETECTED',
  'SYSTEMIC_CONCENTRATION_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_executive_operations_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
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
  "operationsType" "RelationalExecutiveOperationsType" NOT NULL,
  "operationsPriority" "RelationalExecutiveOperationsPriority" NOT NULL,
  "operationsStatus" "RelationalExecutiveOperationsStatus" NOT NULL,
  "severity" "RelationalExecutiveOperationsSeverity" NOT NULL,
  "executiveOperationsScore" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_executive_operations_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_operations_nodes_nodeCode_key" ON "relational_executive_operations_nodes"("nodeCode");
CREATE INDEX "relational_executive_operations_nodes_relationshipId_idx" ON "relational_executive_operations_nodes"("relationshipId");
CREATE INDEX "relational_executive_operations_nodes_executiveOperationsScore_idx" ON "relational_executive_operations_nodes"("executiveOperationsScore");
CREATE INDEX "relational_executive_operations_nodes_executivePressure_idx" ON "relational_executive_operations_nodes"("executivePressure");
CREATE INDEX "relational_executive_operations_nodes_systemicConcentration_idx" ON "relational_executive_operations_nodes"("systemicConcentration");
CREATE INDEX "relational_executive_operations_nodes_resilienceStrength_idx" ON "relational_executive_operations_nodes"("resilienceStrength");
CREATE INDEX "relational_executive_operations_nodes_territoryCountry_idx" ON "relational_executive_operations_nodes"("territoryCountry");
CREATE INDEX "relational_executive_operations_nodes_sectorSlug_idx" ON "relational_executive_operations_nodes"("sectorSlug");
CREATE INDEX "relational_executive_operations_nodes_operationsPriority_idx" ON "relational_executive_operations_nodes"("operationsPriority");
CREATE INDEX "relational_executive_operations_nodes_createdAt_idx" ON "relational_executive_operations_nodes"("createdAt");

CREATE TABLE "relational_executive_operations_signals" (
  "id" UUID NOT NULL,
  "operationsNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalExecutiveOperationsSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_operations_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_operations_signals_signalCode_key" ON "relational_executive_operations_signals"("signalCode");
CREATE INDEX "relational_executive_operations_signals_operationsNodeId_idx" ON "relational_executive_operations_signals"("operationsNodeId");
CREATE INDEX "relational_executive_operations_signals_relationshipId_idx" ON "relational_executive_operations_signals"("relationshipId");
CREATE INDEX "relational_executive_operations_signals_signalType_idx" ON "relational_executive_operations_signals"("signalType");

CREATE TABLE "relational_executive_operations_matrices" (
  "id" UUID NOT NULL,
  "operationsNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "matrixCode" TEXT NOT NULL,
  "matrixType" "RelationalExecutiveOperationsMatrixType" NOT NULL,
  "severity" "RelationalExecutiveOperationsSeverity" NOT NULL,
  "priority" "RelationalExecutiveOperationsPriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "executivePressure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_operations_matrices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_operations_matrices_matrixCode_key" ON "relational_executive_operations_matrices"("matrixCode");
CREATE INDEX "relational_executive_operations_matrices_operationsNodeId_idx" ON "relational_executive_operations_matrices"("operationsNodeId");
CREATE INDEX "relational_executive_operations_matrices_relationshipId_idx" ON "relational_executive_operations_matrices"("relationshipId");
CREATE INDEX "relational_executive_operations_matrices_matrixType_idx" ON "relational_executive_operations_matrices"("matrixType");
CREATE INDEX "relational_executive_operations_matrices_severity_idx" ON "relational_executive_operations_matrices"("severity");

CREATE TABLE "relational_executive_operations_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "operationsNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "operationsStatus" "RelationalExecutiveOperationsStatus" NOT NULL,
  "executiveOperationsScore" INTEGER NOT NULL,
  "executivePressure" INTEGER NOT NULL,
  "systemicConcentration" INTEGER NOT NULL,
  "resilienceStrength" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_operations_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_operations_snapshots_snapshotCode_key" ON "relational_executive_operations_snapshots"("snapshotCode");
CREATE INDEX "relational_executive_operations_snapshots_relationshipId_idx" ON "relational_executive_operations_snapshots"("relationshipId");
CREATE INDEX "relational_executive_operations_snapshots_executiveOperationsScore_idx" ON "relational_executive_operations_snapshots"("executiveOperationsScore");
CREATE INDEX "relational_executive_operations_snapshots_createdAt_idx" ON "relational_executive_operations_snapshots"("createdAt");

CREATE TABLE "relational_executive_operations_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "operationsNodeId" UUID,
  "eventType" "RelationalExecutiveOperationsEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_operations_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_executive_operations_events_relationshipId_idx" ON "relational_executive_operations_events"("relationshipId");
CREATE INDEX "relational_executive_operations_events_operationsNodeId_idx" ON "relational_executive_operations_events"("operationsNodeId");
CREATE INDEX "relational_executive_operations_events_eventType_idx" ON "relational_executive_operations_events"("eventType");
CREATE INDEX "relational_executive_operations_events_createdAt_idx" ON "relational_executive_operations_events"("createdAt");

ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_strategicCommandNodeId_fkey" FOREIGN KEY ("strategicCommandNodeId") REFERENCES "relational_strategic_command_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_strategicIntelligenceNodeId_fkey" FOREIGN KEY ("strategicIntelligenceNodeId") REFERENCES "relational_strategic_intelligence_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_institutionalReportingNodeId_fkey" FOREIGN KEY ("institutionalReportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_executiveOrchestrationNodeId_fkey" FOREIGN KEY ("executiveOrchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_nodes" ADD CONSTRAINT "relational_executive_operations_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_executive_operations_signals" ADD CONSTRAINT "relational_executive_operations_signals_operationsNodeId_fkey" FOREIGN KEY ("operationsNodeId") REFERENCES "relational_executive_operations_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_signals" ADD CONSTRAINT "relational_executive_operations_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_executive_operations_matrices" ADD CONSTRAINT "relational_executive_operations_matrices_operationsNodeId_fkey" FOREIGN KEY ("operationsNodeId") REFERENCES "relational_executive_operations_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_matrices" ADD CONSTRAINT "relational_executive_operations_matrices_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_executive_operations_snapshots" ADD CONSTRAINT "relational_executive_operations_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_snapshots" ADD CONSTRAINT "relational_executive_operations_snapshots_operationsNodeId_fkey" FOREIGN KEY ("operationsNodeId") REFERENCES "relational_executive_operations_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_executive_operations_events" ADD CONSTRAINT "relational_executive_operations_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_operations_events" ADD CONSTRAINT "relational_executive_operations_events_operationsNodeId_fkey" FOREIGN KEY ("operationsNodeId") REFERENCES "relational_executive_operations_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
