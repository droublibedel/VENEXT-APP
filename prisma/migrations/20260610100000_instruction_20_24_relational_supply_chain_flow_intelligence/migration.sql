-- Instruction 20.24 — relational supply flow intelligence (corridor economic flow reading, not TMS/WMS/GPS)

CREATE TYPE "RelationalSupplyFlowType" AS ENUM (
  'CORRIDOR_PRODUCT',
  'FULFILLMENT_COUPLING',
  'CROSS_TERRITORY_SPAN',
  'SECTOR_BRIDGE',
  'PEER_INFLUENCED',
  'UNKNOWN'
);

CREATE TYPE "RelationalSupplyFlowPressureLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "RelationalSupplyFlowRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'SEVERE');

CREATE TYPE "RelationalSupplyFlowSignalType" AS ENUM (
  'FLOW_PRESSURE_ESCALATION',
  'CONTINUITY_WARNING',
  'BOTTLENECK_CLUSTER',
  'DISRUPTION_RISK',
  'DEPENDENCY_STRESS',
  'PROPAGATION_READING',
  'ASYMMETRY_READING'
);

CREATE TYPE "RelationalSupplyFlowEventType" AS ENUM (
  'FLOW_NODE_CREATED',
  'FLOW_PRESSURE_DETECTED',
  'FLOW_BOTTLENECK_DETECTED',
  'FLOW_DISRUPTION_RISK_DETECTED',
  'FLOW_DEPENDENCY_CREATED',
  'FLOW_PROPAGATION_DETECTED',
  'FLOW_ARCHIVED'
);

CREATE TYPE "RelationalSupplyFlowDependencyType" AS ENUM (
  'PARALLEL_REDUNDANT',
  'SEQUENTIAL_DOWNSTREAM',
  'SECTOR_ANCHORED',
  'TERRITORY_ANCHORED',
  'ORGANIZATIONAL_PAIR',
  'FULFILLMENT_CHAIN',
  'CONCENTRATION_SINGLE_ACTOR'
);

CREATE TABLE "relational_supply_flow_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "sectorNodeId" UUID,
  "geoZoneId" UUID,
  "flowCode" TEXT NOT NULL,
  "flowType" "RelationalSupplyFlowType" NOT NULL,
  "flowName" TEXT NOT NULL,
  "sourceOrganizationId" UUID NOT NULL,
  "targetOrganizationId" UUID NOT NULL,
  "productCategory" TEXT NOT NULL,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "pressureLevel" "RelationalSupplyFlowPressureLevel" NOT NULL,
  "riskLevel" "RelationalSupplyFlowRiskLevel" NOT NULL,
  "flowVolumeScore" INTEGER NOT NULL DEFAULT 0,
  "flowStabilityScore" INTEGER NOT NULL DEFAULT 0,
  "fulfillmentReliabilityScore" INTEGER NOT NULL DEFAULT 0,
  "supplyContinuityScore" INTEGER NOT NULL DEFAULT 0,
  "disruptionRiskScore" INTEGER NOT NULL DEFAULT 0,
  "bottleneckScore" INTEGER NOT NULL DEFAULT 0,
  "dependencyScore" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_supply_flow_nodes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_supply_flow_nodes_flowCode_key" UNIQUE ("flowCode"),
  CONSTRAINT "relational_supply_flow_nodes_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_supply_flow_nodes_sectorNodeId_fkey"
    FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "relational_supply_flow_nodes_geoZoneId_fkey"
    FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_supply_flow_nodes_relationshipId_idx" ON "relational_supply_flow_nodes"("relationshipId");
CREATE INDEX "relational_supply_flow_nodes_flowType_idx" ON "relational_supply_flow_nodes"("flowType");
CREATE INDEX "relational_supply_flow_nodes_pressureLevel_idx" ON "relational_supply_flow_nodes"("pressureLevel");
CREATE INDEX "relational_supply_flow_nodes_riskLevel_idx" ON "relational_supply_flow_nodes"("riskLevel");
CREATE INDEX "relational_supply_flow_nodes_productCategory_idx" ON "relational_supply_flow_nodes"("productCategory");
CREATE INDEX "relational_supply_flow_nodes_territoryCountry_idx" ON "relational_supply_flow_nodes"("territoryCountry");
CREATE INDEX "relational_supply_flow_nodes_territoryCity_idx" ON "relational_supply_flow_nodes"("territoryCity");

CREATE TABLE "relational_supply_flow_edges" (
  "id" UUID NOT NULL,
  "sourceFlowId" UUID NOT NULL,
  "targetFlowId" UUID NOT NULL,
  "dependencyType" "RelationalSupplyFlowDependencyType" NOT NULL,
  "dependencyStrength" INTEGER NOT NULL,
  "propagationProbability" DOUBLE PRECISION NOT NULL,
  "bottleneckTransferScore" INTEGER NOT NULL,
  "sharedPressureScore" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_supply_flow_edges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_supply_flow_edges_sourceFlowId_fkey"
    FOREIGN KEY ("sourceFlowId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_supply_flow_edges_targetFlowId_fkey"
    FOREIGN KEY ("targetFlowId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_supply_flow_edges_sourceFlowId_idx" ON "relational_supply_flow_edges"("sourceFlowId");
CREATE INDEX "relational_supply_flow_edges_targetFlowId_idx" ON "relational_supply_flow_edges"("targetFlowId");
CREATE INDEX "relational_supply_flow_edges_dependencyType_idx" ON "relational_supply_flow_edges"("dependencyType");

CREATE TABLE "relational_supply_flow_signals" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "flowNodeId" UUID NOT NULL,
  "signalType" "RelationalSupplyFlowSignalType" NOT NULL,
  "riskLevel" "RelationalSupplyFlowRiskLevel" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "description" VARCHAR(4000) NOT NULL,
  "signalScore" INTEGER NOT NULL,
  "pressureContribution" INTEGER NOT NULL,
  "propagationRisk" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_supply_flow_signals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_supply_flow_signals_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_supply_flow_signals_flowNodeId_fkey"
    FOREIGN KEY ("flowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_supply_flow_signals_relationshipId_idx" ON "relational_supply_flow_signals"("relationshipId");
CREATE INDEX "relational_supply_flow_signals_flowNodeId_idx" ON "relational_supply_flow_signals"("flowNodeId");
CREATE INDEX "relational_supply_flow_signals_signalType_idx" ON "relational_supply_flow_signals"("signalType");
CREATE INDEX "relational_supply_flow_signals_riskLevel_idx" ON "relational_supply_flow_signals"("riskLevel");

CREATE TABLE "relational_supply_flow_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "flowNodeId" UUID,
  "eventType" "RelationalSupplyFlowEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_supply_flow_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_supply_flow_events_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_supply_flow_events_flowNodeId_fkey"
    FOREIGN KEY ("flowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_supply_flow_events_relationshipId_idx" ON "relational_supply_flow_events"("relationshipId");
CREATE INDEX "relational_supply_flow_events_flowNodeId_idx" ON "relational_supply_flow_events"("flowNodeId");
CREATE INDEX "relational_supply_flow_events_eventType_idx" ON "relational_supply_flow_events"("eventType");
CREATE INDEX "relational_supply_flow_events_createdAt_idx" ON "relational_supply_flow_events"("createdAt");
