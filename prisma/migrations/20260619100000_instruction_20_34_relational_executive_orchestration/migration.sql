-- Instruction 20.34 — Relational Executive Economic Orchestration & Strategic Oversight Matrix

CREATE TYPE "RelationalExecutiveOrchestrationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalExecutiveOrchestrationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalExecutiveOrchestrationType" AS ENUM (
  'EXECUTIVE_MATRIX',
  'SYSTEMIC_COORDINATION',
  'CRITICAL_CORRIDOR_ORCHESTRATION',
  'STRATEGIC_ALIGNMENT'
);
CREATE TYPE "RelationalExecutiveOrchestrationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalExecutiveOrchestrationSignalType" AS ENUM (
  'EXECUTIVE',
  'SYSTEMIC',
  'COORDINATION',
  'RESILIENCE',
  'ALIGNMENT'
);
CREATE TYPE "RelationalExecutiveOrchestrationEventType" AS ENUM (
  'INSTABILITY_DETECTED',
  'SYSTEMIC_EXPOSURE_DETECTED',
  'PRIORITY_DETECTED',
  'COORDINATION_BREAKDOWN_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_executive_orchestration_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
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
  "orchestrationType" "RelationalExecutiveOrchestrationType" NOT NULL,
  "orchestrationPriority" "RelationalExecutiveOrchestrationPriority" NOT NULL,
  "orchestrationStatus" "RelationalExecutiveOrchestrationStatus" NOT NULL,
  "severity" "RelationalExecutiveOrchestrationSeverity" NOT NULL,
  "orchestrationScore" INTEGER NOT NULL DEFAULT 0,
  "executiveCoordinationPressure" INTEGER NOT NULL DEFAULT 0,
  "systemicExposure" INTEGER NOT NULL DEFAULT 0,
  "executiveResilience" INTEGER NOT NULL DEFAULT 0,
  "strategicAlignmentScore" INTEGER NOT NULL DEFAULT 0,
  "governancePressure" INTEGER NOT NULL DEFAULT 0,
  "arbitrationPressure" INTEGER NOT NULL DEFAULT 0,
  "stabilizationPressure" INTEGER NOT NULL DEFAULT 0,
  "monitoringPressure" INTEGER NOT NULL DEFAULT 0,
  "recoveryPressure" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyPressure" INTEGER NOT NULL DEFAULT 0,
  "dependencyPressure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_executive_orchestration_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_orchestration_nodes_nodeCode_key" ON "relational_executive_orchestration_nodes"("nodeCode");
CREATE INDEX "relational_executive_orchestration_nodes_relationshipId_idx" ON "relational_executive_orchestration_nodes"("relationshipId");
CREATE INDEX "relational_executive_orchestration_nodes_orchestrationScore_idx" ON "relational_executive_orchestration_nodes"("orchestrationScore");
CREATE INDEX "relational_executive_orchestration_nodes_executiveCoordinationPressure_idx" ON "relational_executive_orchestration_nodes"("executiveCoordinationPressure");
CREATE INDEX "relational_executive_orchestration_nodes_systemicExposure_idx" ON "relational_executive_orchestration_nodes"("systemicExposure");
CREATE INDEX "relational_executive_orchestration_nodes_executiveResilience_idx" ON "relational_executive_orchestration_nodes"("executiveResilience");
CREATE INDEX "relational_executive_orchestration_nodes_territoryCountry_idx" ON "relational_executive_orchestration_nodes"("territoryCountry");
CREATE INDEX "relational_executive_orchestration_nodes_sectorSlug_idx" ON "relational_executive_orchestration_nodes"("sectorSlug");
CREATE INDEX "relational_executive_orchestration_nodes_orchestrationPriority_idx" ON "relational_executive_orchestration_nodes"("orchestrationPriority");
CREATE INDEX "relational_executive_orchestration_nodes_createdAt_idx" ON "relational_executive_orchestration_nodes"("createdAt");

CREATE TABLE "relational_executive_orchestration_signals" (
  "id" UUID NOT NULL,
  "orchestrationNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalExecutiveOrchestrationSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_orchestration_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_orchestration_signals_signalCode_key" ON "relational_executive_orchestration_signals"("signalCode");
CREATE INDEX "relational_executive_orchestration_signals_orchestrationNodeId_idx" ON "relational_executive_orchestration_signals"("orchestrationNodeId");
CREATE INDEX "relational_executive_orchestration_signals_relationshipId_idx" ON "relational_executive_orchestration_signals"("relationshipId");
CREATE INDEX "relational_executive_orchestration_signals_signalType_idx" ON "relational_executive_orchestration_signals"("signalType");

CREATE TABLE "relational_executive_orchestration_dependencies" (
  "id" UUID NOT NULL,
  "sourceNodeId" UUID NOT NULL,
  "targetNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "dependencyCode" TEXT NOT NULL,
  "dependencyWeight" INTEGER NOT NULL DEFAULT 0,
  "crossCorridorExposure" INTEGER NOT NULL DEFAULT 0,
  "coordinationStress" INTEGER NOT NULL DEFAULT 0,
  "concentrationScore" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_orchestration_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_orchestration_dependencies_dependencyCode_key" ON "relational_executive_orchestration_dependencies"("dependencyCode");
CREATE INDEX "relational_executive_orchestration_dependencies_sourceNodeId_idx" ON "relational_executive_orchestration_dependencies"("sourceNodeId");
CREATE INDEX "relational_executive_orchestration_dependencies_targetNodeId_idx" ON "relational_executive_orchestration_dependencies"("targetNodeId");
CREATE INDEX "relational_executive_orchestration_dependencies_relationshipId_idx" ON "relational_executive_orchestration_dependencies"("relationshipId");

CREATE TABLE "relational_executive_orchestration_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "orchestrationNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "orchestrationStatus" "RelationalExecutiveOrchestrationStatus" NOT NULL,
  "orchestrationScore" INTEGER NOT NULL,
  "executiveCoordinationPressure" INTEGER NOT NULL,
  "systemicExposure" INTEGER NOT NULL,
  "executiveResilience" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_orchestration_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_executive_orchestration_snapshots_snapshotCode_key" ON "relational_executive_orchestration_snapshots"("snapshotCode");
CREATE INDEX "relational_executive_orchestration_snapshots_relationshipId_idx" ON "relational_executive_orchestration_snapshots"("relationshipId");
CREATE INDEX "relational_executive_orchestration_snapshots_orchestrationScore_idx" ON "relational_executive_orchestration_snapshots"("orchestrationScore");
CREATE INDEX "relational_executive_orchestration_snapshots_createdAt_idx" ON "relational_executive_orchestration_snapshots"("createdAt");

CREATE TABLE "relational_executive_orchestration_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "orchestrationNodeId" UUID,
  "eventType" "RelationalExecutiveOrchestrationEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_executive_orchestration_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_executive_orchestration_events_relationshipId_idx" ON "relational_executive_orchestration_events"("relationshipId");
CREATE INDEX "relational_executive_orchestration_events_orchestrationNodeId_idx" ON "relational_executive_orchestration_events"("orchestrationNodeId");
CREATE INDEX "relational_executive_orchestration_events_eventType_idx" ON "relational_executive_orchestration_events"("eventType");
CREATE INDEX "relational_executive_orchestration_events_createdAt_idx" ON "relational_executive_orchestration_events"("createdAt");

ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_nodes" ADD CONSTRAINT "relational_executive_orchestration_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_executive_orchestration_signals" ADD CONSTRAINT "relational_executive_orchestration_signals_orchestrationNodeId_fkey" FOREIGN KEY ("orchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_signals" ADD CONSTRAINT "relational_executive_orchestration_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_executive_orchestration_dependencies" ADD CONSTRAINT "relational_executive_orchestration_dependencies_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_dependencies" ADD CONSTRAINT "relational_executive_orchestration_dependencies_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_dependencies" ADD CONSTRAINT "relational_executive_orchestration_dependencies_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_executive_orchestration_snapshots" ADD CONSTRAINT "relational_executive_orchestration_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_snapshots" ADD CONSTRAINT "relational_executive_orchestration_snapshots_orchestrationNodeId_fkey" FOREIGN KEY ("orchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_executive_orchestration_events" ADD CONSTRAINT "relational_executive_orchestration_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_executive_orchestration_events" ADD CONSTRAINT "relational_executive_orchestration_events_orchestrationNodeId_fkey" FOREIGN KEY ("orchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
