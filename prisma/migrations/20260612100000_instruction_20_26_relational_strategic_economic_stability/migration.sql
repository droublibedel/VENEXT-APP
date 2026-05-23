-- Instruction 20.26 — Relational Strategic Economic Stability & Corridor Continuity Intelligence

CREATE TYPE "RelationalEconomicStabilitySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicContinuityStatus" AS ENUM ('STABLE', 'WATCH', 'STRESSED', 'UNSTABLE', 'CRITICAL');
CREATE TYPE "RelationalEconomicContinuitySignalType" AS ENUM (
  'STABILITY_DEGRADATION',
  'CONTINUITY_PRESSURE',
  'LONG_TERM_DEPENDENCY',
  'RECOVERY_STRESS',
  'COLLAPSE_RISK',
  'SYSTEMIC_CONTINUITY',
  'TEMPORAL_FRAGILITY',
  'SECTOR_DRIFT'
);
CREATE TYPE "RelationalEconomicInstabilityType" AS ENUM (
  'CORRIDOR_INSTABILITY',
  'SECTOR_DRIFT',
  'TERRITORY_VULNERABILITY',
  'MACRO_DECOUPLING',
  'SUPPLY_DISRUPTION',
  'DEPENDENCY_CONCENTRATION',
  'TEMPORAL_DECAY'
);
CREATE TYPE "RelationalEconomicContinuityEventType" AS ENUM (
  'NODE_MATERIALIZED',
  'STABILITY_DETECTED',
  'INSTABILITY_DETECTED',
  'RECOVERY_DETECTED',
  'COLLAPSE_RISK_DETECTED',
  'SYSTEMIC_PRESSURE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_economic_continuity_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "macroEconomicNodeId" UUID,
  "supplyFlowNodeId" UUID,
  "geoZoneId" UUID,
  "sectorNodeId" UUID,
  "continuityNodeCode" TEXT NOT NULL,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "sectorSlug" TEXT,
  "continuityScore" INTEGER NOT NULL DEFAULT 0,
  "corridorDurability" INTEGER NOT NULL DEFAULT 0,
  "economicStability" INTEGER NOT NULL DEFAULT 0,
  "instabilityScore" INTEGER NOT NULL DEFAULT 0,
  "continuityPressure" INTEGER NOT NULL DEFAULT 0,
  "dependencyDurability" INTEGER NOT NULL DEFAULT 0,
  "economicSurvivalProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "recoveryProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "systemicContinuityRisk" INTEGER NOT NULL DEFAULT 0,
  "continuityStatus" "RelationalEconomicContinuityStatus" NOT NULL,
  "severity" "RelationalEconomicStabilitySeverity" NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relational_economic_continuity_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_continuity_dependencies" (
  "id" UUID NOT NULL,
  "sourceContinuityNodeId" UUID NOT NULL,
  "targetContinuityNodeId" UUID NOT NULL,
  "instabilityType" "RelationalEconomicInstabilityType" NOT NULL,
  "dependencyDurability" INTEGER NOT NULL,
  "continuityTransferScore" INTEGER NOT NULL,
  "recoveryPropagationProbability" DOUBLE PRECISION NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_continuity_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_continuity_signals" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "continuityNodeId" UUID,
  "signalType" "RelationalEconomicContinuitySignalType" NOT NULL,
  "severity" "RelationalEconomicStabilitySeverity" NOT NULL,
  "instabilityType" "RelationalEconomicInstabilityType" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "description" VARCHAR(4000) NOT NULL,
  "signalScore" INTEGER NOT NULL,
  "continuityContribution" INTEGER NOT NULL,
  "recoveryPressure" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_continuity_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_continuity_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "continuityNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "continuityStatus" "RelationalEconomicContinuityStatus" NOT NULL,
  "continuityScore" INTEGER NOT NULL,
  "instabilityScore" INTEGER NOT NULL,
  "recoveryProbability" DOUBLE PRECISION NOT NULL,
  "systemicContinuityRisk" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_continuity_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_continuity_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "continuityNodeId" UUID,
  "eventType" "RelationalEconomicContinuityEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_continuity_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_economic_continuity_nodes_continuityNodeCode_key" ON "relational_economic_continuity_nodes"("continuityNodeCode");
CREATE INDEX "relational_economic_continuity_nodes_relationshipId_idx" ON "relational_economic_continuity_nodes"("relationshipId");
CREATE INDEX "relational_economic_continuity_nodes_territoryCountry_idx" ON "relational_economic_continuity_nodes"("territoryCountry");
CREATE INDEX "relational_economic_continuity_nodes_territoryCity_idx" ON "relational_economic_continuity_nodes"("territoryCity");
CREATE INDEX "relational_economic_continuity_nodes_sectorSlug_idx" ON "relational_economic_continuity_nodes"("sectorSlug");
CREATE INDEX "relational_economic_continuity_nodes_continuityScore_idx" ON "relational_economic_continuity_nodes"("continuityScore");
CREATE INDEX "relational_economic_continuity_nodes_instabilityScore_idx" ON "relational_economic_continuity_nodes"("instabilityScore");
CREATE INDEX "relational_economic_continuity_nodes_recoveryProbability_idx" ON "relational_economic_continuity_nodes"("recoveryProbability");
CREATE INDEX "relational_economic_continuity_nodes_continuityStatus_idx" ON "relational_economic_continuity_nodes"("continuityStatus");
CREATE INDEX "relational_economic_continuity_nodes_severity_idx" ON "relational_economic_continuity_nodes"("severity");

CREATE INDEX "relational_economic_continuity_dependencies_sourceContinuityNodeId_idx" ON "relational_economic_continuity_dependencies"("sourceContinuityNodeId");
CREATE INDEX "relational_economic_continuity_dependencies_targetContinuityNodeId_idx" ON "relational_economic_continuity_dependencies"("targetContinuityNodeId");
CREATE INDEX "relational_economic_continuity_dependencies_instabilityType_idx" ON "relational_economic_continuity_dependencies"("instabilityType");

CREATE INDEX "relational_economic_continuity_signals_relationshipId_idx" ON "relational_economic_continuity_signals"("relationshipId");
CREATE INDEX "relational_economic_continuity_signals_continuityNodeId_idx" ON "relational_economic_continuity_signals"("continuityNodeId");
CREATE INDEX "relational_economic_continuity_signals_signalType_idx" ON "relational_economic_continuity_signals"("signalType");
CREATE INDEX "relational_economic_continuity_signals_severity_idx" ON "relational_economic_continuity_signals"("severity");
CREATE INDEX "relational_economic_continuity_signals_createdAt_idx" ON "relational_economic_continuity_signals"("createdAt");

CREATE UNIQUE INDEX "relational_economic_continuity_snapshots_snapshotCode_key" ON "relational_economic_continuity_snapshots"("snapshotCode");
CREATE INDEX "relational_economic_continuity_snapshots_relationshipId_idx" ON "relational_economic_continuity_snapshots"("relationshipId");
CREATE INDEX "relational_economic_continuity_snapshots_continuityNodeId_idx" ON "relational_economic_continuity_snapshots"("continuityNodeId");
CREATE INDEX "relational_economic_continuity_snapshots_continuityScore_idx" ON "relational_economic_continuity_snapshots"("continuityScore");
CREATE INDEX "relational_economic_continuity_snapshots_instabilityScore_idx" ON "relational_economic_continuity_snapshots"("instabilityScore");
CREATE INDEX "relational_economic_continuity_snapshots_recoveryProbability_idx" ON "relational_economic_continuity_snapshots"("recoveryProbability");
CREATE INDEX "relational_economic_continuity_snapshots_createdAt_idx" ON "relational_economic_continuity_snapshots"("createdAt");

CREATE INDEX "relational_economic_continuity_events_relationshipId_idx" ON "relational_economic_continuity_events"("relationshipId");
CREATE INDEX "relational_economic_continuity_events_continuityNodeId_idx" ON "relational_economic_continuity_events"("continuityNodeId");
CREATE INDEX "relational_economic_continuity_events_eventType_idx" ON "relational_economic_continuity_events"("eventType");
CREATE INDEX "relational_economic_continuity_events_createdAt_idx" ON "relational_economic_continuity_events"("createdAt");

ALTER TABLE "relational_economic_continuity_nodes" ADD CONSTRAINT "relational_economic_continuity_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_continuity_nodes" ADD CONSTRAINT "relational_economic_continuity_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_continuity_nodes" ADD CONSTRAINT "relational_economic_continuity_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_continuity_nodes" ADD CONSTRAINT "relational_economic_continuity_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_continuity_nodes" ADD CONSTRAINT "relational_economic_continuity_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_continuity_dependencies" ADD CONSTRAINT "relational_economic_continuity_dependencies_sourceContinuityNodeId_fkey" FOREIGN KEY ("sourceContinuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_continuity_dependencies" ADD CONSTRAINT "relational_economic_continuity_dependencies_targetContinuityNodeId_fkey" FOREIGN KEY ("targetContinuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_continuity_signals" ADD CONSTRAINT "relational_economic_continuity_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_continuity_signals" ADD CONSTRAINT "relational_economic_continuity_signals_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_continuity_snapshots" ADD CONSTRAINT "relational_economic_continuity_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_continuity_snapshots" ADD CONSTRAINT "relational_economic_continuity_snapshots_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_continuity_events" ADD CONSTRAINT "relational_economic_continuity_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_continuity_events" ADD CONSTRAINT "relational_economic_continuity_events_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
