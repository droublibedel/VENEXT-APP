-- Instruction 20.32 — Relational Economic Strategic Stabilization & Multi-Corridor Resilience

CREATE TYPE "RelationalEconomicStabilizationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicStabilizationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalEconomicStabilizationType" AS ENUM (
  'STRATEGIC_STABILIZATION',
  'MULTI_CORRIDOR_RESILIENCE',
  'SYSTEMIC_CONTAINMENT',
  'FRAGILE_CORRIDOR'
);
CREATE TYPE "RelationalEconomicStabilizationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicStabilizationSignalType" AS ENUM (
  'INSTABILITY',
  'RESILIENCE',
  'PRESSURE',
  'EXPOSURE',
  'COORDINATION'
);
CREATE TYPE "RelationalEconomicStabilizationEventType" AS ENUM (
  'STABILITY_DETECTED',
  'INSTABILITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SYSTEMIC_RISK_DETECTED',
  'PRIORITY_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_economic_stabilization_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
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
  "stabilizationType" "RelationalEconomicStabilizationType" NOT NULL,
  "stabilizationPriority" "RelationalEconomicStabilizationPriority" NOT NULL,
  "stabilizationStatus" "RelationalEconomicStabilizationStatus" NOT NULL,
  "severity" "RelationalEconomicStabilizationSeverity" NOT NULL,
  "stabilizationScore" INTEGER NOT NULL DEFAULT 0,
  "instabilityPressure" INTEGER NOT NULL DEFAULT 0,
  "resilienceLevel" INTEGER NOT NULL DEFAULT 0,
  "systemicExposure" INTEGER NOT NULL DEFAULT 0,
  "dependencyPressure" INTEGER NOT NULL DEFAULT 0,
  "continuityPressure" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyPressure" INTEGER NOT NULL DEFAULT 0,
  "arbitrationPressure" INTEGER NOT NULL DEFAULT 0,
  "governancePressure" INTEGER NOT NULL DEFAULT 0,
  "recoveryPressure" INTEGER NOT NULL DEFAULT 0,
  "coordinationStress" INTEGER NOT NULL DEFAULT 0,
  "stabilizationUrgency" INTEGER NOT NULL DEFAULT 0,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "sectorSlug" TEXT,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relational_economic_stabilization_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_stabilization_signals" (
  "id" UUID NOT NULL,
  "stabilizationNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalEconomicStabilizationSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "exposureLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_stabilization_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_stabilization_dependencies" (
  "id" UUID NOT NULL,
  "sourceStabilizationNodeId" UUID NOT NULL,
  "targetStabilizationNodeId" UUID,
  "relationshipId" UUID NOT NULL,
  "dependencyCode" TEXT NOT NULL,
  "dependencyWeight" INTEGER NOT NULL DEFAULT 0,
  "crossCorridorExposure" INTEGER NOT NULL DEFAULT 0,
  "propagationStress" INTEGER NOT NULL DEFAULT 0,
  "concentrationScore" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_stabilization_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_stabilization_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "stabilizationNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "stabilizationStatus" "RelationalEconomicStabilizationStatus" NOT NULL,
  "stabilizationScore" INTEGER NOT NULL,
  "instabilityPressure" INTEGER NOT NULL,
  "resilienceLevel" INTEGER NOT NULL,
  "systemicExposure" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_stabilization_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_stabilization_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "stabilizationNodeId" UUID,
  "eventType" "RelationalEconomicStabilizationEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_stabilization_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_economic_stabilization_nodes_nodeCode_key" ON "relational_economic_stabilization_nodes"("nodeCode");
CREATE INDEX "relational_economic_stabilization_nodes_relationshipId_idx" ON "relational_economic_stabilization_nodes"("relationshipId");
CREATE INDEX "relational_economic_stabilization_nodes_stabilizationScore_idx" ON "relational_economic_stabilization_nodes"("stabilizationScore");
CREATE INDEX "relational_economic_stabilization_nodes_instabilityPressure_idx" ON "relational_economic_stabilization_nodes"("instabilityPressure");
CREATE INDEX "relational_economic_stabilization_nodes_resilienceLevel_idx" ON "relational_economic_stabilization_nodes"("resilienceLevel");
CREATE INDEX "relational_economic_stabilization_nodes_territoryCountry_idx" ON "relational_economic_stabilization_nodes"("territoryCountry");
CREATE INDEX "relational_economic_stabilization_nodes_sectorSlug_idx" ON "relational_economic_stabilization_nodes"("sectorSlug");
CREATE INDEX "relational_economic_stabilization_nodes_stabilizationPriority_idx" ON "relational_economic_stabilization_nodes"("stabilizationPriority");
CREATE INDEX "relational_economic_stabilization_nodes_createdAt_idx" ON "relational_economic_stabilization_nodes"("createdAt");

CREATE UNIQUE INDEX "relational_economic_stabilization_signals_signalCode_key" ON "relational_economic_stabilization_signals"("signalCode");
CREATE INDEX "relational_economic_stabilization_signals_stabilizationNodeId_idx" ON "relational_economic_stabilization_signals"("stabilizationNodeId");
CREATE INDEX "relational_economic_stabilization_signals_relationshipId_idx" ON "relational_economic_stabilization_signals"("relationshipId");

CREATE UNIQUE INDEX "relational_economic_stabilization_dependencies_dependencyCode_key" ON "relational_economic_stabilization_dependencies"("dependencyCode");
CREATE INDEX "relational_economic_stabilization_dependencies_sourceStabilizationNodeId_idx" ON "relational_economic_stabilization_dependencies"("sourceStabilizationNodeId");
CREATE INDEX "relational_economic_stabilization_dependencies_relationshipId_idx" ON "relational_economic_stabilization_dependencies"("relationshipId");

CREATE UNIQUE INDEX "relational_economic_stabilization_snapshots_snapshotCode_key" ON "relational_economic_stabilization_snapshots"("snapshotCode");
CREATE INDEX "relational_economic_stabilization_snapshots_relationshipId_idx" ON "relational_economic_stabilization_snapshots"("relationshipId");
CREATE INDEX "relational_economic_stabilization_snapshots_stabilizationScore_idx" ON "relational_economic_stabilization_snapshots"("stabilizationScore");
CREATE INDEX "relational_economic_stabilization_snapshots_instabilityPressure_idx" ON "relational_economic_stabilization_snapshots"("instabilityPressure");
CREATE INDEX "relational_economic_stabilization_snapshots_resilienceLevel_idx" ON "relational_economic_stabilization_snapshots"("resilienceLevel");
CREATE INDEX "relational_economic_stabilization_snapshots_systemicExposure_idx" ON "relational_economic_stabilization_snapshots"("systemicExposure");
CREATE INDEX "relational_economic_stabilization_snapshots_createdAt_idx" ON "relational_economic_stabilization_snapshots"("createdAt");

CREATE INDEX "relational_economic_stabilization_events_relationshipId_idx" ON "relational_economic_stabilization_events"("relationshipId");
CREATE INDEX "relational_economic_stabilization_events_stabilizationNodeId_idx" ON "relational_economic_stabilization_events"("stabilizationNodeId");
CREATE INDEX "relational_economic_stabilization_events_eventType_idx" ON "relational_economic_stabilization_events"("eventType");
CREATE INDEX "relational_economic_stabilization_events_createdAt_idx" ON "relational_economic_stabilization_events"("createdAt");

ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_nodes" ADD CONSTRAINT "relational_economic_stabilization_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_stabilization_signals" ADD CONSTRAINT "relational_economic_stabilization_signals_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_signals" ADD CONSTRAINT "relational_economic_stabilization_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_stabilization_dependencies" ADD CONSTRAINT "relational_economic_stabilization_dependencies_sourceStabilizationNodeId_fkey" FOREIGN KEY ("sourceStabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_dependencies" ADD CONSTRAINT "relational_economic_stabilization_dependencies_targetStabilizationNodeId_fkey" FOREIGN KEY ("targetStabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_dependencies" ADD CONSTRAINT "relational_economic_stabilization_dependencies_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_stabilization_snapshots" ADD CONSTRAINT "relational_economic_stabilization_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_snapshots" ADD CONSTRAINT "relational_economic_stabilization_snapshots_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_stabilization_events" ADD CONSTRAINT "relational_economic_stabilization_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_stabilization_events" ADD CONSTRAINT "relational_economic_stabilization_events_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
