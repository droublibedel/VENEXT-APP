-- Instruction 20.27 — Relational Economic Sovereignty & Strategic Corridor Autonomy Intelligence

CREATE TYPE "RelationalEconomicSovereigntySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicAutonomyStatus" AS ENUM ('SOVEREIGN', 'BALANCED', 'DEPENDENT', 'CAPTIVE', 'CRITICAL');
CREATE TYPE "RelationalEconomicDependencyExposure" AS ENUM ('MINIMAL', 'MODERATE', 'ELEVATED', 'CRITICAL', 'SYSTEMIC');
CREATE TYPE "RelationalEconomicSovereigntySignalType" AS ENUM (
  'AUTONOMY_DEGRADATION',
  'DEPENDENCY_CONCENTRATION',
  'CAPTIVITY_RISK',
  'RECOVERY_AUTONOMY',
  'SYSTEMIC_EXPOSURE',
  'EXTERNAL_DEPENDENCY',
  'LONG_TERM_CAPTURE',
  'SUPPLY_INDEPENDENCE_STRESS'
);
CREATE TYPE "RelationalEconomicSovereigntyEventType" AS ENUM (
  'NODE_MATERIALIZED',
  'AUTONOMY_DETECTED',
  'DEPENDENCY_DETECTED',
  'CAPTIVITY_DETECTED',
  'RECOVERY_DETECTED',
  'SYSTEMIC_EXPOSURE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_economic_sovereignty_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "continuityNodeId" UUID,
  "macroEconomicNodeId" UUID,
  "supplyFlowNodeId" UUID,
  "geoZoneId" UUID,
  "sectorNodeId" UUID,
  "sovereigntyNodeCode" TEXT NOT NULL,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "sectorSlug" TEXT,
  "sovereigntyScore" INTEGER NOT NULL DEFAULT 0,
  "autonomyScore" INTEGER NOT NULL DEFAULT 0,
  "dependencyExposureScore" INTEGER NOT NULL DEFAULT 0,
  "dependencyExposureLevel" "RelationalEconomicDependencyExposure" NOT NULL,
  "dependencyConcentration" INTEGER NOT NULL DEFAULT 0,
  "externalDependencyExposure" INTEGER NOT NULL DEFAULT 0,
  "resilienceAutonomy" INTEGER NOT NULL DEFAULT 0,
  "recoveryAutonomy" INTEGER NOT NULL DEFAULT 0,
  "strategicCaptivityRisk" INTEGER NOT NULL DEFAULT 0,
  "corridorSelfRecoveryProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "dependencyCriticality" INTEGER NOT NULL DEFAULT 0,
  "systemicAutonomyRisk" INTEGER NOT NULL DEFAULT 0,
  "autonomyStatus" "RelationalEconomicAutonomyStatus" NOT NULL,
  "severity" "RelationalEconomicSovereigntySeverity" NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relational_economic_sovereignty_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_sovereignty_dependencies" (
  "id" UUID NOT NULL,
  "sourceSovereigntyNodeId" UUID NOT NULL,
  "targetSovereigntyNodeId" UUID NOT NULL,
  "exposureLevel" "RelationalEconomicDependencyExposure" NOT NULL,
  "dependencyConcentration" INTEGER NOT NULL,
  "captivityTransferScore" INTEGER NOT NULL,
  "autonomyRecoveryProbability" DOUBLE PRECISION NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_sovereignty_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_sovereignty_signals" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "sovereigntyNodeId" UUID,
  "signalType" "RelationalEconomicSovereigntySignalType" NOT NULL,
  "severity" "RelationalEconomicSovereigntySeverity" NOT NULL,
  "exposureLevel" "RelationalEconomicDependencyExposure" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "description" VARCHAR(4000) NOT NULL,
  "signalScore" INTEGER NOT NULL,
  "sovereigntyContribution" INTEGER NOT NULL,
  "captivityPressure" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_sovereignty_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_sovereignty_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "sovereigntyNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "autonomyStatus" "RelationalEconomicAutonomyStatus" NOT NULL,
  "sovereigntyScore" INTEGER NOT NULL,
  "autonomyScore" INTEGER NOT NULL,
  "dependencyExposureScore" INTEGER NOT NULL,
  "resilienceAutonomy" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_sovereignty_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_sovereignty_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "sovereigntyNodeId" UUID,
  "eventType" "RelationalEconomicSovereigntyEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_sovereignty_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_economic_sovereignty_nodes_sovereigntyNodeCode_key" ON "relational_economic_sovereignty_nodes"("sovereigntyNodeCode");
CREATE INDEX "relational_economic_sovereignty_nodes_relationshipId_idx" ON "relational_economic_sovereignty_nodes"("relationshipId");
CREATE INDEX "relational_economic_sovereignty_nodes_territoryCountry_idx" ON "relational_economic_sovereignty_nodes"("territoryCountry");
CREATE INDEX "relational_economic_sovereignty_nodes_territoryCity_idx" ON "relational_economic_sovereignty_nodes"("territoryCity");
CREATE INDEX "relational_economic_sovereignty_nodes_sectorSlug_idx" ON "relational_economic_sovereignty_nodes"("sectorSlug");
CREATE INDEX "relational_economic_sovereignty_nodes_sovereigntyScore_idx" ON "relational_economic_sovereignty_nodes"("sovereigntyScore");
CREATE INDEX "relational_economic_sovereignty_nodes_dependencyExposureScore_idx" ON "relational_economic_sovereignty_nodes"("dependencyExposureScore");
CREATE INDEX "relational_economic_sovereignty_nodes_autonomyScore_idx" ON "relational_economic_sovereignty_nodes"("autonomyScore");
CREATE INDEX "relational_economic_sovereignty_nodes_resilienceAutonomy_idx" ON "relational_economic_sovereignty_nodes"("resilienceAutonomy");
CREATE INDEX "relational_economic_sovereignty_nodes_autonomyStatus_idx" ON "relational_economic_sovereignty_nodes"("autonomyStatus");
CREATE INDEX "relational_economic_sovereignty_nodes_severity_idx" ON "relational_economic_sovereignty_nodes"("severity");

CREATE INDEX "relational_economic_sovereignty_dependencies_sourceSovereigntyNodeId_idx" ON "relational_economic_sovereignty_dependencies"("sourceSovereigntyNodeId");
CREATE INDEX "relational_economic_sovereignty_dependencies_targetSovereigntyNodeId_idx" ON "relational_economic_sovereignty_dependencies"("targetSovereigntyNodeId");
CREATE INDEX "relational_economic_sovereignty_dependencies_exposureLevel_idx" ON "relational_economic_sovereignty_dependencies"("exposureLevel");

CREATE INDEX "relational_economic_sovereignty_signals_relationshipId_idx" ON "relational_economic_sovereignty_signals"("relationshipId");
CREATE INDEX "relational_economic_sovereignty_signals_sovereigntyNodeId_idx" ON "relational_economic_sovereignty_signals"("sovereigntyNodeId");
CREATE INDEX "relational_economic_sovereignty_signals_signalType_idx" ON "relational_economic_sovereignty_signals"("signalType");
CREATE INDEX "relational_economic_sovereignty_signals_severity_idx" ON "relational_economic_sovereignty_signals"("severity");
CREATE INDEX "relational_economic_sovereignty_signals_createdAt_idx" ON "relational_economic_sovereignty_signals"("createdAt");

CREATE UNIQUE INDEX "relational_economic_sovereignty_snapshots_snapshotCode_key" ON "relational_economic_sovereignty_snapshots"("snapshotCode");
CREATE INDEX "relational_economic_sovereignty_snapshots_relationshipId_idx" ON "relational_economic_sovereignty_snapshots"("relationshipId");
CREATE INDEX "relational_economic_sovereignty_snapshots_sovereigntyNodeId_idx" ON "relational_economic_sovereignty_snapshots"("sovereigntyNodeId");
CREATE INDEX "relational_economic_sovereignty_snapshots_sovereigntyScore_idx" ON "relational_economic_sovereignty_snapshots"("sovereigntyScore");
CREATE INDEX "relational_economic_sovereignty_snapshots_dependencyExposureScore_idx" ON "relational_economic_sovereignty_snapshots"("dependencyExposureScore");
CREATE INDEX "relational_economic_sovereignty_snapshots_autonomyScore_idx" ON "relational_economic_sovereignty_snapshots"("autonomyScore");
CREATE INDEX "relational_economic_sovereignty_snapshots_resilienceAutonomy_idx" ON "relational_economic_sovereignty_snapshots"("resilienceAutonomy");
CREATE INDEX "relational_economic_sovereignty_snapshots_createdAt_idx" ON "relational_economic_sovereignty_snapshots"("createdAt");

CREATE INDEX "relational_economic_sovereignty_events_relationshipId_idx" ON "relational_economic_sovereignty_events"("relationshipId");
CREATE INDEX "relational_economic_sovereignty_events_sovereigntyNodeId_idx" ON "relational_economic_sovereignty_events"("sovereigntyNodeId");
CREATE INDEX "relational_economic_sovereignty_events_eventType_idx" ON "relational_economic_sovereignty_events"("eventType");
CREATE INDEX "relational_economic_sovereignty_events_createdAt_idx" ON "relational_economic_sovereignty_events"("createdAt");

ALTER TABLE "relational_economic_sovereignty_nodes" ADD CONSTRAINT "relational_economic_sovereignty_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_nodes" ADD CONSTRAINT "relational_economic_sovereignty_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_nodes" ADD CONSTRAINT "relational_economic_sovereignty_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_nodes" ADD CONSTRAINT "relational_economic_sovereignty_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_nodes" ADD CONSTRAINT "relational_economic_sovereignty_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_nodes" ADD CONSTRAINT "relational_economic_sovereignty_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_sovereignty_dependencies" ADD CONSTRAINT "relational_economic_sovereignty_dependencies_sourceSovereigntyNodeId_fkey" FOREIGN KEY ("sourceSovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_dependencies" ADD CONSTRAINT "relational_economic_sovereignty_dependencies_targetSovereigntyNodeId_fkey" FOREIGN KEY ("targetSovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_sovereignty_signals" ADD CONSTRAINT "relational_economic_sovereignty_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_signals" ADD CONSTRAINT "relational_economic_sovereignty_signals_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_sovereignty_snapshots" ADD CONSTRAINT "relational_economic_sovereignty_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_snapshots" ADD CONSTRAINT "relational_economic_sovereignty_snapshots_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_sovereignty_events" ADD CONSTRAINT "relational_economic_sovereignty_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_sovereignty_events" ADD CONSTRAINT "relational_economic_sovereignty_events_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
