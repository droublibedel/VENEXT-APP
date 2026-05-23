-- Instruction 20.23 — relational sector intelligence & market structure (analytical, not ERP/CRM)

CREATE TYPE "RelationalSectorType" AS ENUM (
  'PRIMARY_INDUSTRY',
  'SECONDARY_VALUE_ADD',
  'DISTRIBUTION_LOGISTICS',
  'SERVICES',
  'MIXED_CROSS_SECTOR',
  'UNKNOWN'
);

CREATE TYPE "RelationalSectorPressureLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "RelationalSectorConcentrationLevel" AS ENUM ('DISPERSED', 'MODERATE', 'CONCENTRATED', 'DOMINANT');

CREATE TYPE "RelationalSectorSignalType" AS ENUM (
  'SECTOR_PRESSURE_ALERT',
  'DEPENDENCY_SPIKE',
  'CONCENTRATION_WARNING',
  'PROPAGATION_ALERT',
  'MARKET_FRAGILITY',
  'EXPANSION_READING',
  'SYSTEMIC_SECTOR_RISK'
);

CREATE TYPE "RelationalSectorDependencyType" AS ENUM (
  'UPSTREAM_SUPPLY',
  'DOWNSTREAM_DEMAND',
  'SHARED_INFRASTRUCTURE',
  'TERRITORIAL_OVERLAP',
  'CORRIDOR_CO_MOVEMENT',
  'CROSS_SECTOR_EXPOSURE'
);

CREATE TYPE "RelationalSectorEventType" AS ENUM (
  'SECTOR_NODE_MATERIALIZED',
  'DEPENDENCY_OBSERVED',
  'SIGNAL_EMITTED',
  'PROPAGATION_EVALUATED',
  'SIGNAL_ARCHIVED',
  'STRUCTURE_RECOMPUTED'
);

CREATE TYPE "RelationalSectorMarketStructureType" AS ENUM (
  'COMPETITIVE_FRAGMENTED',
  'MODERATE_OLIGOPOLY',
  'TIGHT_OLIGOPOLY',
  'MONOPSONY_RISK',
  'BALANCED',
  'UNKNOWN'
);

CREATE TABLE "relational_sector_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "sectorCode" TEXT NOT NULL,
  "sectorType" "RelationalSectorType" NOT NULL,
  "sectorName" TEXT NOT NULL,
  "sectorSlug" TEXT NOT NULL,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "marketStructureType" "RelationalSectorMarketStructureType" NOT NULL,
  "concentrationLevel" "RelationalSectorConcentrationLevel" NOT NULL,
  "pressureLevel" "RelationalSectorPressureLevel" NOT NULL,
  "operationalRiskScore" INTEGER NOT NULL DEFAULT 0,
  "expansionPotentialScore" INTEGER NOT NULL DEFAULT 0,
  "fragilityScore" INTEGER NOT NULL DEFAULT 0,
  "dependencyScore" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_sector_nodes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_sector_nodes_sectorCode_key" UNIQUE ("sectorCode"),
  CONSTRAINT "relational_sector_nodes_relationshipId_sectorSlug_key" UNIQUE ("relationshipId", "sectorSlug"),
  CONSTRAINT "relational_sector_nodes_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_sector_nodes_relationshipId_idx" ON "relational_sector_nodes"("relationshipId");
CREATE INDEX "relational_sector_nodes_sectorType_idx" ON "relational_sector_nodes"("sectorType");
CREATE INDEX "relational_sector_nodes_concentrationLevel_idx" ON "relational_sector_nodes"("concentrationLevel");
CREATE INDEX "relational_sector_nodes_pressureLevel_idx" ON "relational_sector_nodes"("pressureLevel");
CREATE INDEX "relational_sector_nodes_operationalRiskScore_idx" ON "relational_sector_nodes"("operationalRiskScore");
CREATE INDEX "relational_sector_nodes_territoryCountry_idx" ON "relational_sector_nodes"("territoryCountry");
CREATE INDEX "relational_sector_nodes_territoryCity_idx" ON "relational_sector_nodes"("territoryCity");

CREATE TABLE "relational_sector_dependencies" (
  "id" UUID NOT NULL,
  "sourceSectorId" UUID NOT NULL,
  "targetSectorId" UUID NOT NULL,
  "dependencyType" "RelationalSectorDependencyType" NOT NULL,
  "dependencyStrength" INTEGER NOT NULL,
  "propagationProbability" DOUBLE PRECISION NOT NULL,
  "riskTransferScore" INTEGER NOT NULL,
  "sharedPressureScore" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_sector_dependencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_sector_dependencies_sourceSectorId_fkey"
    FOREIGN KEY ("sourceSectorId") REFERENCES "relational_sector_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_sector_dependencies_targetSectorId_fkey"
    FOREIGN KEY ("targetSectorId") REFERENCES "relational_sector_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_sector_dependencies_sourceSectorId_idx" ON "relational_sector_dependencies"("sourceSectorId");
CREATE INDEX "relational_sector_dependencies_targetSectorId_idx" ON "relational_sector_dependencies"("targetSectorId");

CREATE TABLE "relational_sector_signals" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "sectorNodeId" UUID NOT NULL,
  "signalType" "RelationalSectorSignalType" NOT NULL,
  "severity" VARCHAR(16) NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "description" VARCHAR(4000) NOT NULL,
  "signalScore" INTEGER NOT NULL,
  "propagationRisk" INTEGER NOT NULL,
  "pressureContribution" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_sector_signals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_sector_signals_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_sector_signals_sectorNodeId_fkey"
    FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_sector_signals_relationshipId_idx" ON "relational_sector_signals"("relationshipId");
CREATE INDEX "relational_sector_signals_sectorNodeId_idx" ON "relational_sector_signals"("sectorNodeId");
CREATE INDEX "relational_sector_signals_signalType_idx" ON "relational_sector_signals"("signalType");

CREATE TABLE "relational_sector_events" (
  "id" UUID NOT NULL,
  "eventType" "RelationalSectorEventType" NOT NULL,
  "sectorNodeId" UUID,
  "relationshipId" UUID,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_sector_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_sector_events_sectorNodeId_fkey"
    FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "relational_sector_events_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_sector_events_sectorNodeId_idx" ON "relational_sector_events"("sectorNodeId");
CREATE INDEX "relational_sector_events_relationshipId_idx" ON "relational_sector_events"("relationshipId");
CREATE INDEX "relational_sector_events_eventType_idx" ON "relational_sector_events"("eventType");
CREATE INDEX "relational_sector_events_createdAt_idx" ON "relational_sector_events"("createdAt");
