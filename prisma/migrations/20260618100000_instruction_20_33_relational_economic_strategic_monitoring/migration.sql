-- Instruction 20.33 — Relational Economic Strategic Monitoring & Executive Control

CREATE TYPE "RelationalEconomicMonitoringSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicMonitoringStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalEconomicMonitoringType" AS ENUM (
  'EXECUTIVE_SUPERVISION',
  'SYSTEMIC_OVERSIGHT',
  'CRITICAL_CORRIDOR_WATCH',
  'STRATEGIC_BALANCE'
);
CREATE TYPE "RelationalEconomicMonitoringPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicMonitoringSignalType" AS ENUM (
  'EXECUTIVE',
  'SYSTEMIC',
  'COORDINATION',
  'RESILIENCE',
  'PRESSURE'
);
CREATE TYPE "RelationalEconomicMonitoringAlertType" AS ENUM (
  'EXECUTIVE_PRESSURE',
  'SYSTEMIC_ESCALATION',
  'CRITICAL_CORRIDOR',
  'STABILIZATION_FAILURE',
  'GOVERNANCE_OVERLOAD',
  'DEPENDENCY_COLLAPSE',
  'TERRITORIAL_IMBALANCE',
  'RECOVERY_DEGRADATION'
);
CREATE TYPE "RelationalEconomicMonitoringEventType" AS ENUM (
  'EXECUTIVE_ALERT_DETECTED',
  'SYSTEMIC_RISK_DETECTED',
  'CRITICAL_CORRIDOR_DETECTED',
  'PRIORITY_DETECTED',
  'ESCALATION_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_economic_monitoring_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
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
  "monitoringType" "RelationalEconomicMonitoringType" NOT NULL,
  "monitoringPriority" "RelationalEconomicMonitoringPriority" NOT NULL,
  "monitoringStatus" "RelationalEconomicMonitoringStatus" NOT NULL,
  "severity" "RelationalEconomicMonitoringSeverity" NOT NULL,
  "monitoringScore" INTEGER NOT NULL DEFAULT 0,
  "executivePressure" INTEGER NOT NULL DEFAULT 0,
  "systemicRisk" INTEGER NOT NULL DEFAULT 0,
  "resilienceLevel" INTEGER NOT NULL DEFAULT 0,
  "governancePressure" INTEGER NOT NULL DEFAULT 0,
  "arbitrationPressure" INTEGER NOT NULL DEFAULT 0,
  "stabilizationPressure" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyPressure" INTEGER NOT NULL DEFAULT 0,
  "recoveryPressure" INTEGER NOT NULL DEFAULT 0,
  "coordinationPressure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_economic_monitoring_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_monitoring_signals" (
  "id" UUID NOT NULL,
  "monitoringNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalEconomicMonitoringSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_monitoring_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_monitoring_alerts" (
  "id" UUID NOT NULL,
  "monitoringNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "alertCode" TEXT NOT NULL,
  "alertType" "RelationalEconomicMonitoringAlertType" NOT NULL,
  "severity" "RelationalEconomicMonitoringSeverity" NOT NULL,
  "priority" "RelationalEconomicMonitoringPriority" NOT NULL,
  "alertPressure" INTEGER NOT NULL DEFAULT 0,
  "systemicExposure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_monitoring_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_monitoring_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "monitoringNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "monitoringStatus" "RelationalEconomicMonitoringStatus" NOT NULL,
  "monitoringScore" INTEGER NOT NULL,
  "executivePressure" INTEGER NOT NULL,
  "systemicRisk" INTEGER NOT NULL,
  "resilienceLevel" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_monitoring_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_monitoring_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "monitoringNodeId" UUID,
  "eventType" "RelationalEconomicMonitoringEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_monitoring_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_economic_monitoring_nodes_nodeCode_key" ON "relational_economic_monitoring_nodes"("nodeCode");
CREATE INDEX "relational_economic_monitoring_nodes_relationshipId_idx" ON "relational_economic_monitoring_nodes"("relationshipId");
CREATE INDEX "relational_economic_monitoring_nodes_monitoringScore_idx" ON "relational_economic_monitoring_nodes"("monitoringScore");
CREATE INDEX "relational_economic_monitoring_nodes_executivePressure_idx" ON "relational_economic_monitoring_nodes"("executivePressure");
CREATE INDEX "relational_economic_monitoring_nodes_systemicRisk_idx" ON "relational_economic_monitoring_nodes"("systemicRisk");
CREATE INDEX "relational_economic_monitoring_nodes_resilienceLevel_idx" ON "relational_economic_monitoring_nodes"("resilienceLevel");
CREATE INDEX "relational_economic_monitoring_nodes_territoryCountry_idx" ON "relational_economic_monitoring_nodes"("territoryCountry");
CREATE INDEX "relational_economic_monitoring_nodes_sectorSlug_idx" ON "relational_economic_monitoring_nodes"("sectorSlug");
CREATE INDEX "relational_economic_monitoring_nodes_createdAt_idx" ON "relational_economic_monitoring_nodes"("createdAt");

CREATE UNIQUE INDEX "relational_economic_monitoring_signals_signalCode_key" ON "relational_economic_monitoring_signals"("signalCode");
CREATE INDEX "relational_economic_monitoring_signals_monitoringNodeId_idx" ON "relational_economic_monitoring_signals"("monitoringNodeId");
CREATE INDEX "relational_economic_monitoring_signals_relationshipId_idx" ON "relational_economic_monitoring_signals"("relationshipId");

CREATE UNIQUE INDEX "relational_economic_monitoring_alerts_alertCode_key" ON "relational_economic_monitoring_alerts"("alertCode");
CREATE INDEX "relational_economic_monitoring_alerts_monitoringNodeId_idx" ON "relational_economic_monitoring_alerts"("monitoringNodeId");
CREATE INDEX "relational_economic_monitoring_alerts_relationshipId_idx" ON "relational_economic_monitoring_alerts"("relationshipId");

CREATE UNIQUE INDEX "relational_economic_monitoring_snapshots_snapshotCode_key" ON "relational_economic_monitoring_snapshots"("snapshotCode");
CREATE INDEX "relational_economic_monitoring_snapshots_relationshipId_idx" ON "relational_economic_monitoring_snapshots"("relationshipId");
CREATE INDEX "relational_economic_monitoring_snapshots_monitoringScore_idx" ON "relational_economic_monitoring_snapshots"("monitoringScore");
CREATE INDEX "relational_economic_monitoring_snapshots_executivePressure_idx" ON "relational_economic_monitoring_snapshots"("executivePressure");
CREATE INDEX "relational_economic_monitoring_snapshots_systemicRisk_idx" ON "relational_economic_monitoring_snapshots"("systemicRisk");
CREATE INDEX "relational_economic_monitoring_snapshots_resilienceLevel_idx" ON "relational_economic_monitoring_snapshots"("resilienceLevel");
CREATE INDEX "relational_economic_monitoring_snapshots_createdAt_idx" ON "relational_economic_monitoring_snapshots"("createdAt");

CREATE INDEX "relational_economic_monitoring_events_relationshipId_idx" ON "relational_economic_monitoring_events"("relationshipId");
CREATE INDEX "relational_economic_monitoring_events_monitoringNodeId_idx" ON "relational_economic_monitoring_events"("monitoringNodeId");
CREATE INDEX "relational_economic_monitoring_events_eventType_idx" ON "relational_economic_monitoring_events"("eventType");
CREATE INDEX "relational_economic_monitoring_events_createdAt_idx" ON "relational_economic_monitoring_events"("createdAt");

ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_nodes" ADD CONSTRAINT "relational_economic_monitoring_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_monitoring_signals" ADD CONSTRAINT "relational_economic_monitoring_signals_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_signals" ADD CONSTRAINT "relational_economic_monitoring_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_monitoring_alerts" ADD CONSTRAINT "relational_economic_monitoring_alerts_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_alerts" ADD CONSTRAINT "relational_economic_monitoring_alerts_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_monitoring_snapshots" ADD CONSTRAINT "relational_economic_monitoring_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_snapshots" ADD CONSTRAINT "relational_economic_monitoring_snapshots_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_economic_monitoring_events" ADD CONSTRAINT "relational_economic_monitoring_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_economic_monitoring_events" ADD CONSTRAINT "relational_economic_monitoring_events_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
