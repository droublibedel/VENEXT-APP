-- Instruction 20.19 — relational economic signal graph & cross-corridor correlation (deterministic)

CREATE TYPE "RelationalEconomicSignalSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicSignalNodeType" AS ENUM ('CORRIDOR', 'CORRIDOR_GROUP', 'OPERATIONAL_CLUSTER', 'ECONOMIC_ZONE');
CREATE TYPE "RelationalEconomicCorrelationStrength" AS ENUM ('WEAK', 'MODERATE', 'STRONG', 'CRITICAL');
CREATE TYPE "RelationalEconomicPropagationRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'CASCADE');
CREATE TYPE "RelationalEconomicDependencyType" AS ENUM ('OPERATIONAL', 'SLA', 'INCIDENT', 'ORCHESTRATION', 'MEMORY_PATTERN', 'SYSTEMIC');
CREATE TYPE "RelationalEconomicSignalEventType" AS ENUM (
  'SIGNAL_CREATED',
  'SIGNAL_CORRELATED',
  'PROPAGATION_DETECTED',
  'SYSTEMIC_RISK_DETECTED',
  'CLUSTER_CREATED',
  'SIGNAL_ARCHIVED'
);

CREATE TABLE "relational_economic_signal_nodes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID,
  "nodeCode" TEXT NOT NULL,
  "nodeType" "RelationalEconomicSignalNodeType" NOT NULL,
  "severity" "RelationalEconomicSignalSeverity" NOT NULL,
  "propagationRisk" "RelationalEconomicPropagationRisk" NOT NULL,
  "dependencyScore" INTEGER NOT NULL,
  "corridorInfluenceScore" INTEGER NOT NULL,
  "operationalFragilityScore" INTEGER NOT NULL,
  "systemicExposureScore" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "observedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_signal_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_signal_edges" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "sourceNodeId" UUID NOT NULL,
  "targetNodeId" UUID NOT NULL,
  "dependencyType" "RelationalEconomicDependencyType" NOT NULL,
  "correlationStrength" "RelationalEconomicCorrelationStrength" NOT NULL,
  "propagationProbability" DOUBLE PRECISION NOT NULL,
  "sharedIncidentCount" INTEGER NOT NULL DEFAULT 0,
  "sharedOperationalStress" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_signal_edges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_signal_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "nodeId" UUID,
  "edgeId" UUID,
  "eventType" "RelationalEconomicSignalEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_signal_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "relational_economic_signal_nodes"
  ADD CONSTRAINT "relational_economic_signal_nodes_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_signal_edges"
  ADD CONSTRAINT "relational_economic_signal_edges_sourceNodeId_fkey"
  FOREIGN KEY ("sourceNodeId") REFERENCES "relational_economic_signal_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_signal_edges"
  ADD CONSTRAINT "relational_economic_signal_edges_targetNodeId_fkey"
  FOREIGN KEY ("targetNodeId") REFERENCES "relational_economic_signal_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_signal_events"
  ADD CONSTRAINT "relational_economic_signal_events_nodeId_fkey"
  FOREIGN KEY ("nodeId") REFERENCES "relational_economic_signal_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_signal_events"
  ADD CONSTRAINT "relational_economic_signal_events_edgeId_fkey"
  FOREIGN KEY ("edgeId") REFERENCES "relational_economic_signal_edges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "relational_economic_signal_nodes_nodeCode_key" ON "relational_economic_signal_nodes"("nodeCode");
CREATE INDEX "relational_economic_signal_nodes_relationshipId_idx" ON "relational_economic_signal_nodes"("relationshipId");
CREATE INDEX "relational_economic_signal_nodes_propagationRisk_idx" ON "relational_economic_signal_nodes"("propagationRisk");
CREATE INDEX "relational_economic_signal_nodes_dependencyScore_idx" ON "relational_economic_signal_nodes"("dependencyScore");

CREATE UNIQUE INDEX "relational_economic_signal_edges_source_target_type_key"
  ON "relational_economic_signal_edges"("sourceNodeId", "targetNodeId", "dependencyType");
CREATE INDEX "relational_economic_signal_edges_sourceNodeId_idx" ON "relational_economic_signal_edges"("sourceNodeId");
CREATE INDEX "relational_economic_signal_edges_targetNodeId_idx" ON "relational_economic_signal_edges"("targetNodeId");

CREATE INDEX "relational_economic_signal_events_nodeId_idx" ON "relational_economic_signal_events"("nodeId");
CREATE INDEX "relational_economic_signal_events_edgeId_idx" ON "relational_economic_signal_events"("edgeId");
CREATE INDEX "relational_economic_signal_events_eventType_idx" ON "relational_economic_signal_events"("eventType");
