-- Instruction 20.30 — Relational Economic Governance & Multi-Corridor Strategic Coordination

CREATE TYPE "RelationalEconomicGovernanceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicGovernanceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'SUSPENDED');
CREATE TYPE "RelationalEconomicGovernanceType" AS ENUM (
  'MULTI_CORRIDOR_COORDINATION',
  'SYSTEMIC_BALANCE',
  'CONFLICT_ARBITRATION',
  'STRATEGIC_PRIORITY',
  'NETWORK_STABILITY'
);
CREATE TYPE "RelationalEconomicGovernancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicGovernanceEventType" AS ENUM (
  'COORDINATION_DETECTED',
  'CONFLICT_DETECTED',
  'PRIORITY_DETECTED',
  'SYSTEMIC_RISK_DETECTED',
  'BALANCE_UPDATED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_economic_governance_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "recoveryPlanId" UUID,
  "sovereigntyNodeId" UUID,
  "continuityNodeId" UUID,
  "macroEconomicNodeId" UUID,
  "supplyFlowNodeId" UUID,
  "geoZoneId" UUID,
  "sectorNodeId" UUID,
  "economicDependencyNodeId" UUID,
  "orchestrationId" UUID,
  "reviewBoardId" UUID,
  "strategicMemoryId" UUID,
  "governanceNodeCode" TEXT NOT NULL,
  "governanceType" "RelationalEconomicGovernanceType" NOT NULL,
  "governancePriority" "RelationalEconomicGovernancePriority" NOT NULL,
  "governanceStatus" "RelationalEconomicGovernanceStatus" NOT NULL,
  "severity" "RelationalEconomicGovernanceSeverity" NOT NULL,
  "governanceScore" INTEGER NOT NULL DEFAULT 0,
  "coordinationScore" INTEGER NOT NULL DEFAULT 0,
  "systemicRisk" INTEGER NOT NULL DEFAULT 0,
  "corridorCriticality" INTEGER NOT NULL DEFAULT 0,
  "recoveryPressure" INTEGER NOT NULL DEFAULT 0,
  "dependencyPressure" INTEGER NOT NULL DEFAULT 0,
  "propagationPressure" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyPressure" INTEGER NOT NULL DEFAULT 0,
  "continuityPressure" INTEGER NOT NULL DEFAULT 0,
  "governanceStability" INTEGER NOT NULL DEFAULT 0,
  "interventionUrgency" INTEGER NOT NULL DEFAULT 0,
  "territoryCountry" TEXT NOT NULL,
  "territoryCity" TEXT NOT NULL,
  "sectorSlug" TEXT,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "relational_economic_governance_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_governance_coordinations" (
  "id" UUID NOT NULL,
  "governanceNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "coordinationCode" TEXT NOT NULL,
  "coordinationScore" INTEGER NOT NULL DEFAULT 0,
  "strategicCorridorCount" INTEGER NOT NULL DEFAULT 0,
  "coordinationOverload" INTEGER NOT NULL DEFAULT 0,
  "balanceScore" INTEGER NOT NULL DEFAULT 0,
  "governancePriorityScore" INTEGER NOT NULL DEFAULT 0,
  "strategicCorridorRefs" JSONB,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_governance_coordinations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_governance_conflicts" (
  "id" UUID NOT NULL,
  "governanceNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "conflictCode" TEXT NOT NULL,
  "conflictType" TEXT NOT NULL,
  "severity" "RelationalEconomicGovernanceSeverity" NOT NULL,
  "priority" "RelationalEconomicGovernancePriority" NOT NULL,
  "affectedCorridors" JSONB,
  "conflictPressure" INTEGER NOT NULL DEFAULT 0,
  "systemicExposure" INTEGER NOT NULL DEFAULT 0,
  "recoveryImpact" INTEGER NOT NULL DEFAULT 0,
  "estimatedResolutionComplexity" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_governance_conflicts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_governance_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "governanceNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "governanceStatus" "RelationalEconomicGovernanceStatus" NOT NULL,
  "governanceScore" INTEGER NOT NULL,
  "coordinationScore" INTEGER NOT NULL,
  "systemicRisk" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_governance_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_governance_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "governanceNodeId" UUID,
  "eventType" "RelationalEconomicGovernanceEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_governance_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_economic_governance_nodes_governanceNodeCode_key" ON "relational_economic_governance_nodes"("governanceNodeCode");
CREATE INDEX "relational_economic_governance_nodes_relationshipId_idx" ON "relational_economic_governance_nodes"("relationshipId");
CREATE INDEX "relational_economic_governance_nodes_governanceScore_idx" ON "relational_economic_governance_nodes"("governanceScore");
CREATE INDEX "relational_economic_governance_nodes_coordinationScore_idx" ON "relational_economic_governance_nodes"("coordinationScore");
CREATE INDEX "relational_economic_governance_nodes_systemicRisk_idx" ON "relational_economic_governance_nodes"("systemicRisk");
CREATE INDEX "relational_economic_governance_nodes_territoryCountry_idx" ON "relational_economic_governance_nodes"("territoryCountry");
CREATE INDEX "relational_economic_governance_nodes_sectorSlug_idx" ON "relational_economic_governance_nodes"("sectorSlug");
CREATE INDEX "relational_economic_governance_nodes_governancePriority_idx" ON "relational_economic_governance_nodes"("governancePriority");
CREATE INDEX "relational_economic_governance_nodes_createdAt_idx" ON "relational_economic_governance_nodes"("createdAt");

CREATE UNIQUE INDEX "relational_economic_governance_coordinations_coordinationCode_key" ON "relational_economic_governance_coordinations"("coordinationCode");
CREATE INDEX "relational_economic_governance_coordinations_governanceNodeId_idx" ON "relational_economic_governance_coordinations"("governanceNodeId");
CREATE INDEX "relational_economic_governance_coordinations_relationshipId_idx" ON "relational_economic_governance_coordinations"("relationshipId");
CREATE INDEX "relational_economic_governance_coordinations_coordinationScore_idx" ON "relational_economic_governance_coordinations"("coordinationScore");

CREATE UNIQUE INDEX "relational_economic_governance_conflicts_conflictCode_key" ON "relational_economic_governance_conflicts"("conflictCode");
CREATE INDEX "relational_economic_governance_conflicts_governanceNodeId_idx" ON "relational_economic_governance_conflicts"("governanceNodeId");
CREATE INDEX "relational_economic_governance_conflicts_relationshipId_idx" ON "relational_economic_governance_conflicts"("relationshipId");

CREATE UNIQUE INDEX "relational_economic_governance_snapshots_snapshotCode_key" ON "relational_economic_governance_snapshots"("snapshotCode");
CREATE INDEX "relational_economic_governance_snapshots_relationshipId_idx" ON "relational_economic_governance_snapshots"("relationshipId");
CREATE INDEX "relational_economic_governance_snapshots_governanceScore_idx" ON "relational_economic_governance_snapshots"("governanceScore");
CREATE INDEX "relational_economic_governance_snapshots_coordinationScore_idx" ON "relational_economic_governance_snapshots"("coordinationScore");
CREATE INDEX "relational_economic_governance_snapshots_systemicRisk_idx" ON "relational_economic_governance_snapshots"("systemicRisk");
CREATE INDEX "relational_economic_governance_snapshots_createdAt_idx" ON "relational_economic_governance_snapshots"("createdAt");

CREATE INDEX "relational_economic_governance_events_relationshipId_idx" ON "relational_economic_governance_events"("relationshipId");
CREATE INDEX "relational_economic_governance_events_governanceNodeId_idx" ON "relational_economic_governance_events"("governanceNodeId");
CREATE INDEX "relational_economic_governance_events_eventType_idx" ON "relational_economic_governance_events"("eventType");
CREATE INDEX "relational_economic_governance_events_createdAt_idx" ON "relational_economic_governance_events"("createdAt");

ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_economicDependencyNodeId_fkey" FOREIGN KEY ("economicDependencyNodeId") REFERENCES "relational_economic_dependency_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_orchestrationId_fkey" FOREIGN KEY ("orchestrationId") REFERENCES "relational_operational_orchestrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_reviewBoardId_fkey" FOREIGN KEY ("reviewBoardId") REFERENCES "relational_scenario_review_boards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_nodes" ADD CONSTRAINT "relational_economic_governance_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_governance_coordinations" ADD CONSTRAINT "relational_economic_governance_coordinations_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_coordinations" ADD CONSTRAINT "relational_economic_governance_coordinations_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_governance_conflicts" ADD CONSTRAINT "relational_economic_governance_conflicts_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_conflicts" ADD CONSTRAINT "relational_economic_governance_conflicts_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_governance_snapshots" ADD CONSTRAINT "relational_economic_governance_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_snapshots" ADD CONSTRAINT "relational_economic_governance_snapshots_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_governance_events" ADD CONSTRAINT "relational_economic_governance_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_governance_events" ADD CONSTRAINT "relational_economic_governance_events_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
