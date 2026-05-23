-- Instruction 20.43 — Relational Macro Strategic Observatory Governance

CREATE TYPE "RelationalMacroObservatoryGovernanceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalMacroObservatoryGovernanceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalMacroObservatoryGovernanceType" AS ENUM (
  'MACRO_GOVERNANCE_OVERVIEW',
  'NETWORK_COORDINATION',
  'SYSTEMIC_GOVERNANCE',
  'EXECUTIVE_NETWORK_ALIGNMENT'
);
CREATE TYPE "RelationalMacroObservatoryGovernancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalMacroObservatoryGovernanceSignalType" AS ENUM (
  'GOVERNANCE',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'BALANCE'
);
CREATE TYPE "RelationalMacroObservatoryGovernanceMatrixType" AS ENUM (
  'MACRO_OBSERVATORY_GOVERNANCE_MATRIX',
  'EXECUTIVE_COORDINATION_MATRIX',
  'SYSTEMIC_GOVERNANCE_MATRIX',
  'TERRITORIAL_BALANCE_MATRIX',
  'SECTOR_BALANCE_MATRIX',
  'RESILIENCE_GOVERNANCE_MATRIX',
  'NETWORK_ALIGNMENT_MATRIX'
);
CREATE TYPE "RelationalMacroObservatoryGovernanceEventType" AS ENUM (
  'MATRIX_GENERATED',
  'EXECUTIVE_COORDINATION_DETECTED',
  'SYSTEMIC_CONCENTRATION_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_macro_observatory_governance_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "strategicObservatoryNodeId" UUID,
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
  "macroGovernanceType" "RelationalMacroObservatoryGovernanceType" NOT NULL,
  "macroGovernancePriority" "RelationalMacroObservatoryGovernancePriority" NOT NULL,
  "macroGovernanceStatus" "RelationalMacroObservatoryGovernanceStatus" NOT NULL,
  "severity" "RelationalMacroObservatoryGovernanceSeverity" NOT NULL,
  "macroGovernanceScore" INTEGER NOT NULL DEFAULT 0,
  "executiveCoordinationPressure" INTEGER NOT NULL DEFAULT 0,
  "systemicConcentration" INTEGER NOT NULL DEFAULT 0,
  "resilienceStrength" INTEGER NOT NULL DEFAULT 0,
  "networkAlignmentPressure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_macro_observatory_governance_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_macro_observatory_governance_nodes_nodeCode_key" ON "relational_macro_observatory_governance_nodes"("nodeCode");
CREATE INDEX "relational_macro_observatory_governance_nodes_relationshipId_idx" ON "relational_macro_observatory_governance_nodes"("relationshipId");
CREATE INDEX "relational_macro_observatory_governance_nodes_macroGovernanceScore_idx" ON "relational_macro_observatory_governance_nodes"("macroGovernanceScore");
CREATE INDEX "relational_macro_observatory_governance_nodes_executiveCoordinationPressure_idx" ON "relational_macro_observatory_governance_nodes"("executiveCoordinationPressure");
CREATE INDEX "relational_macro_observatory_governance_nodes_systemicConcentration_idx" ON "relational_macro_observatory_governance_nodes"("systemicConcentration");
CREATE INDEX "relational_macro_observatory_governance_nodes_resilienceStrength_idx" ON "relational_macro_observatory_governance_nodes"("resilienceStrength");
CREATE INDEX "relational_macro_observatory_governance_nodes_territoryCountry_idx" ON "relational_macro_observatory_governance_nodes"("territoryCountry");
CREATE INDEX "relational_macro_observatory_governance_nodes_sectorSlug_idx" ON "relational_macro_observatory_governance_nodes"("sectorSlug");
CREATE INDEX "relational_macro_observatory_governance_nodes_macroGovernancePriority_idx" ON "relational_macro_observatory_governance_nodes"("macroGovernancePriority");
CREATE INDEX "relational_macro_observatory_governance_nodes_createdAt_idx" ON "relational_macro_observatory_governance_nodes"("createdAt");

ALTER TABLE "relational_macro_observatory_governance_nodes" ADD CONSTRAINT "relational_macro_observatory_governance_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_macro_observatory_governance_nodes" ADD CONSTRAINT "relational_macro_observatory_governance_nodes_strategicObservatoryNodeId_fkey" FOREIGN KEY ("strategicObservatoryNodeId") REFERENCES "relational_strategic_observatory_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "relational_macro_observatory_governance_signals" (
  "id" UUID NOT NULL,
  "macroObservatoryGovernanceNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalMacroObservatoryGovernanceSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_macro_observatory_governance_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_macro_observatory_governance_signals_signalCode_key" ON "relational_macro_observatory_governance_signals"("signalCode");
ALTER TABLE "relational_macro_observatory_governance_signals" ADD CONSTRAINT "relational_macro_observatory_governance_signals_macroObservatoryGovernanceNodeId_fkey" FOREIGN KEY ("macroObservatoryGovernanceNodeId") REFERENCES "relational_macro_observatory_governance_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_macro_observatory_governance_signals" ADD CONSTRAINT "relational_macro_observatory_governance_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_macro_observatory_governance_matrices" (
  "id" UUID NOT NULL,
  "macroObservatoryGovernanceNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "matrixCode" TEXT NOT NULL,
  "matrixType" "RelationalMacroObservatoryGovernanceMatrixType" NOT NULL,
  "severity" "RelationalMacroObservatoryGovernanceSeverity" NOT NULL,
  "priority" "RelationalMacroObservatoryGovernancePriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "executiveCoordinationPressure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_macro_observatory_governance_matrices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_macro_observatory_governance_matrices_matrixCode_key" ON "relational_macro_observatory_governance_matrices"("matrixCode");
ALTER TABLE "relational_macro_observatory_governance_matrices" ADD CONSTRAINT "relational_macro_observatory_governance_matrices_macroObservatoryGovernanceNodeId_fkey" FOREIGN KEY ("macroObservatoryGovernanceNodeId") REFERENCES "relational_macro_observatory_governance_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_macro_observatory_governance_matrices" ADD CONSTRAINT "relational_macro_observatory_governance_matrices_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_macro_observatory_governance_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "macroObservatoryGovernanceNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "macroGovernanceStatus" "RelationalMacroObservatoryGovernanceStatus" NOT NULL,
  "macroGovernanceScore" INTEGER NOT NULL,
  "executiveCoordinationPressure" INTEGER NOT NULL,
  "systemicConcentration" INTEGER NOT NULL,
  "resilienceStrength" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_macro_observatory_governance_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_macro_observatory_governance_snapshots_snapshotCode_key" ON "relational_macro_observatory_governance_snapshots"("snapshotCode");
ALTER TABLE "relational_macro_observatory_governance_snapshots" ADD CONSTRAINT "relational_macro_observatory_governance_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "relational_macro_observatory_governance_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "macroObservatoryGovernanceNodeId" UUID,
  "eventType" "RelationalMacroObservatoryGovernanceEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_macro_observatory_governance_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "relational_macro_observatory_governance_events" ADD CONSTRAINT "relational_macro_observatory_governance_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
