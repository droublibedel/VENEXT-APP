-- Instruction 20.21 — relational economic pressure & dependency mapping

CREATE TYPE "RelationalEconomicPressureSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "RelationalEconomicPressureDependencyLinkType" AS ENUM (
  'STRATEGIC_DEPENDENCY',
  'SHARED_FULFILLMENT',
  'SHARED_DISTRIBUTION',
  'SHARED_OPERATIONAL_RISK',
  'INCIDENT_PROPAGATION',
  'EXECUTION_DEPENDENCY',
  'REGIONAL_CONCENTRATION',
  'MULTI_CLUSTER_PRESSURE',
  'CRITICAL_ACTOR_EXPOSURE',
  'SYSTEMIC_FRAGILITY'
);

CREATE TYPE "RelationalEconomicDependencyStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TYPE "RelationalEconomicPressureEventType" AS ENUM (
  'PRESSURE_DETECTED',
  'DEPENDENCY_CREATED',
  'SYSTEMIC_CONCENTRATION_DETECTED',
  'PROPAGATION_RISK_INCREASED',
  'CRITICAL_CORRIDOR_IDENTIFIED',
  'DEPENDENCY_ARCHIVED',
  'PRESSURE_ESCALATED'
);

CREATE TABLE "relational_economic_dependency_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "nodeCode" TEXT NOT NULL,
  "dependencyScore" INTEGER NOT NULL,
  "pressureScore" INTEGER NOT NULL,
  "fragilityScore" INTEGER NOT NULL,
  "propagationExposureScore" INTEGER NOT NULL,
  "dependencyDensity" INTEGER NOT NULL,
  "criticalityLevel" "RelationalEconomicPressureSeverity" NOT NULL,
  "systemicWeight" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_economic_dependency_nodes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_economic_dependency_nodes_relationshipId_key" UNIQUE ("relationshipId"),
  CONSTRAINT "relational_economic_dependency_nodes_nodeCode_key" UNIQUE ("nodeCode"),
  CONSTRAINT "relational_economic_dependency_nodes_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_economic_dependency_nodes_relationshipId_criticalityLevel_idx"
  ON "relational_economic_dependency_nodes"("relationshipId", "criticalityLevel");

CREATE TABLE "relational_economic_dependency_edges" (
  "id" UUID NOT NULL,
  "sourceNodeId" UUID NOT NULL,
  "targetNodeId" UUID NOT NULL,
  "dependencyType" "RelationalEconomicPressureDependencyLinkType" NOT NULL,
  "dependencyWeight" INTEGER NOT NULL,
  "propagationProbability" DOUBLE PRECISION NOT NULL,
  "asymmetricDependency" BOOLEAN NOT NULL DEFAULT false,
  "pressureContribution" INTEGER NOT NULL,
  "status" "RelationalEconomicDependencyStatus" NOT NULL DEFAULT 'ACTIVE',
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_economic_dependency_edges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_economic_dependency_edges_sourceNodeId_fkey"
    FOREIGN KEY ("sourceNodeId") REFERENCES "relational_economic_dependency_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relational_economic_dependency_edges_targetNodeId_fkey"
    FOREIGN KEY ("targetNodeId") REFERENCES "relational_economic_dependency_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "relational_economic_dependency_edges_sourceNodeId_idx"
  ON "relational_economic_dependency_edges"("sourceNodeId");
CREATE INDEX "relational_economic_dependency_edges_targetNodeId_idx"
  ON "relational_economic_dependency_edges"("targetNodeId");
CREATE INDEX "relational_economic_dependency_edges_dependencyType_idx"
  ON "relational_economic_dependency_edges"("dependencyType");

CREATE TABLE "relational_economic_pressure_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID,
  "edgeId" UUID,
  "eventType" "RelationalEconomicPressureEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_economic_pressure_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relational_economic_pressure_events_relationshipId_fkey"
    FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "relational_economic_pressure_events_edgeId_fkey"
    FOREIGN KEY ("edgeId") REFERENCES "relational_economic_dependency_edges"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "relational_economic_pressure_events_relationshipId_idx"
  ON "relational_economic_pressure_events"("relationshipId");
CREATE INDEX "relational_economic_pressure_events_eventType_idx"
  ON "relational_economic_pressure_events"("eventType");
CREATE INDEX "relational_economic_pressure_events_createdAt_idx"
  ON "relational_economic_pressure_events"("createdAt");
