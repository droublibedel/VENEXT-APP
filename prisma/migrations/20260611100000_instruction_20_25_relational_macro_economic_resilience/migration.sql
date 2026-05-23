-- Instruction 20.25 — relational macro-economic resilience & adaptive corridor intelligence

CREATE TYPE "RelationalMacroEconomicSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "RelationalMacroEconomicRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'SEVERE');

CREATE TYPE "RelationalMacroEconomicSignalType" AS ENUM (
  'SYSTEMIC_PRESSURE',
  'FRAGILITY_ESCALATION',
  'RESILIENCE_DEGRADATION',
  'PROPAGATION_CONTAGION',
  'COLLAPSE_RISK',
  'ADAPTATION_STRESS',
  'TERRITORIAL_FRAGILITY',
  'SECTOR_CONCENTRATION'
);

CREATE TYPE "RelationalMacroEconomicResilienceStatus" AS ENUM (
  'STABLE',
  'WATCH',
  'STRESSED',
  'FRAGILE',
  'CRITICAL'
);

CREATE TYPE "RelationalMacroEconomicDependencyType" AS ENUM (
  'CORRIDOR_CRITICAL',
  'SECTOR_ANCHORED',
  'TERRITORY_ANCHORED',
  'SUPPLY_FLOW_COUPLED',
  'PRESSURE_PEER',
  'CONCENTRATION',
  'SYSTEMIC_BRIDGE'
);

CREATE TYPE "RelationalMacroEconomicEventType" AS ENUM (
  'NODE_MATERIALIZED',
  'RESILIENCE_DETECTED',
  'FRAGILITY_DETECTED',
  'PROPAGATION_DETECTED',
  'COLLAPSE_RISK_DETECTED',
  'SYSTEMIC_PRESSURE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_macro_economic_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "sectorNodeId" UUID,
  "geoZoneId" UUID,
  "supplyFlowNodeId" UUID,
  "economicDependencyNodeId" UUID,
  "macroNodeCode" TEXT NOT NULL,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "sectorSlug" TEXT,
  "resilienceScore" INTEGER NOT NULL DEFAULT 0,
  "structuralFragility" INTEGER NOT NULL DEFAULT 0,
  "operationalContinuity" INTEGER NOT NULL DEFAULT 0,
  "dependencyExposure" INTEGER NOT NULL DEFAULT 0,
  "adaptationCapacity" INTEGER NOT NULL DEFAULT 0,
  "systemicPressure" INTEGER NOT NULL DEFAULT 0,
  "economicStress" INTEGER NOT NULL DEFAULT 0,
  "corridorRecoveryProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "macroEconomicRisk" INTEGER NOT NULL DEFAULT 0,
  "propagationRisk" INTEGER NOT NULL DEFAULT 0,
  "fragilityScore" INTEGER NOT NULL DEFAULT 0,
  "resilienceStatus" "RelationalMacroEconomicResilienceStatus" NOT NULL,
  "riskLevel" "RelationalMacroEconomicRiskLevel" NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_macro_economic_nodes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_macro_economic_nodes_macroNodeCode_key" UNIQUE ("macroNodeCode"),
  CONSTRAINT "relational_macro_economic_nodes_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_macro_economic_nodes_sectorNodeId_fkey"
    FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "relational_macro_economic_nodes_geoZoneId_fkey"
    FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "relational_macro_economic_nodes_supplyFlowNodeId_fkey"
    FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "relational_macro_economic_nodes_economicDependencyNodeId_fkey"
    FOREIGN KEY ("economicDependencyNodeId") REFERENCES "relational_economic_dependency_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_macro_economic_nodes_relationshipId_idx" ON "relational_macro_economic_nodes"("relationshipId");
CREATE INDEX "relational_macro_economic_nodes_territoryCountry_idx" ON "relational_macro_economic_nodes"("territoryCountry");
CREATE INDEX "relational_macro_economic_nodes_territoryCity_idx" ON "relational_macro_economic_nodes"("territoryCity");
CREATE INDEX "relational_macro_economic_nodes_sectorSlug_idx" ON "relational_macro_economic_nodes"("sectorSlug");
CREATE INDEX "relational_macro_economic_nodes_resilienceScore_idx" ON "relational_macro_economic_nodes"("resilienceScore");
CREATE INDEX "relational_macro_economic_nodes_fragilityScore_idx" ON "relational_macro_economic_nodes"("fragilityScore");
CREATE INDEX "relational_macro_economic_nodes_propagationRisk_idx" ON "relational_macro_economic_nodes"("propagationRisk");
CREATE INDEX "relational_macro_economic_nodes_resilienceStatus_idx" ON "relational_macro_economic_nodes"("resilienceStatus");
CREATE INDEX "relational_macro_economic_nodes_riskLevel_idx" ON "relational_macro_economic_nodes"("riskLevel");

CREATE TABLE "relational_macro_economic_dependencies" (
  "id" UUID NOT NULL,
  "sourceMacroNodeId" UUID NOT NULL,
  "targetMacroNodeId" UUID NOT NULL,
  "dependencyType" "RelationalMacroEconomicDependencyType" NOT NULL,
  "dependencyStrength" INTEGER NOT NULL,
  "propagationProbability" DOUBLE PRECISION NOT NULL,
  "systemicExposureScore" INTEGER NOT NULL,
  "collapseTransferScore" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_macro_economic_dependencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_macro_economic_dependencies_sourceMacroNodeId_fkey"
    FOREIGN KEY ("sourceMacroNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_macro_economic_dependencies_targetMacroNodeId_fkey"
    FOREIGN KEY ("targetMacroNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_macro_economic_dependencies_sourceMacroNodeId_idx" ON "relational_macro_economic_dependencies"("sourceMacroNodeId");
CREATE INDEX "relational_macro_economic_dependencies_targetMacroNodeId_idx" ON "relational_macro_economic_dependencies"("targetMacroNodeId");
CREATE INDEX "relational_macro_economic_dependencies_dependencyType_idx" ON "relational_macro_economic_dependencies"("dependencyType");

CREATE TABLE "relational_macro_economic_pressure_signals" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "macroNodeId" UUID,
  "signalType" "RelationalMacroEconomicSignalType" NOT NULL,
  "severity" "RelationalMacroEconomicSeverity" NOT NULL,
  "riskLevel" "RelationalMacroEconomicRiskLevel" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "description" VARCHAR(4000) NOT NULL,
  "signalScore" INTEGER NOT NULL,
  "pressureContribution" INTEGER NOT NULL,
  "propagationRisk" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_macro_economic_pressure_signals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_macro_economic_pressure_signals_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_macro_economic_pressure_signals_macroNodeId_fkey"
    FOREIGN KEY ("macroNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_macro_economic_pressure_signals_relationshipId_idx" ON "relational_macro_economic_pressure_signals"("relationshipId");
CREATE INDEX "relational_macro_economic_pressure_signals_macroNodeId_idx" ON "relational_macro_economic_pressure_signals"("macroNodeId");
CREATE INDEX "relational_macro_economic_pressure_signals_signalType_idx" ON "relational_macro_economic_pressure_signals"("signalType");
CREATE INDEX "relational_macro_economic_pressure_signals_severity_idx" ON "relational_macro_economic_pressure_signals"("severity");
CREATE INDEX "relational_macro_economic_pressure_signals_createdAt_idx" ON "relational_macro_economic_pressure_signals"("createdAt");

CREATE TABLE "relational_macro_economic_resilience_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "macroNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "resilienceStatus" "RelationalMacroEconomicResilienceStatus" NOT NULL,
  "resilienceScore" INTEGER NOT NULL,
  "structuralFragility" INTEGER NOT NULL,
  "propagationRisk" INTEGER NOT NULL,
  "fragilityScore" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_macro_economic_resilience_snapshots_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_macro_economic_resilience_snapshots_snapshotCode_key" UNIQUE ("snapshotCode"),
  CONSTRAINT "relational_macro_economic_resilience_snapshots_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_macro_economic_resilience_snapshots_macroNodeId_fkey"
    FOREIGN KEY ("macroNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_macro_economic_resilience_snapshots_relationshipId_idx" ON "relational_macro_economic_resilience_snapshots"("relationshipId");
CREATE INDEX "relational_macro_economic_resilience_snapshots_macroNodeId_idx" ON "relational_macro_economic_resilience_snapshots"("macroNodeId");
CREATE INDEX "relational_macro_economic_resilience_snapshots_resilienceScore_idx" ON "relational_macro_economic_resilience_snapshots"("resilienceScore");
CREATE INDEX "relational_macro_economic_resilience_snapshots_fragilityScore_idx" ON "relational_macro_economic_resilience_snapshots"("fragilityScore");
CREATE INDEX "relational_macro_economic_resilience_snapshots_propagationRisk_idx" ON "relational_macro_economic_resilience_snapshots"("propagationRisk");
CREATE INDEX "relational_macro_economic_resilience_snapshots_createdAt_idx" ON "relational_macro_economic_resilience_snapshots"("createdAt");

CREATE TABLE "relational_macro_economic_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "macroNodeId" UUID,
  "eventType" "RelationalMacroEconomicEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_macro_economic_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_macro_economic_events_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_macro_economic_events_macroNodeId_fkey"
    FOREIGN KEY ("macroNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_macro_economic_events_relationshipId_idx" ON "relational_macro_economic_events"("relationshipId");
CREATE INDEX "relational_macro_economic_events_macroNodeId_idx" ON "relational_macro_economic_events"("macroNodeId");
CREATE INDEX "relational_macro_economic_events_eventType_idx" ON "relational_macro_economic_events"("eventType");
CREATE INDEX "relational_macro_economic_events_createdAt_idx" ON "relational_macro_economic_events"("createdAt");
