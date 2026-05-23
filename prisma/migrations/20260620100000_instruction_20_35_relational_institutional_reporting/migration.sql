-- Instruction 20.35 — Relational Institutional Economic Reporting & Strategic Intelligence Briefing

CREATE TYPE "RelationalInstitutionalReportingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalInstitutionalReportingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'OBSERVING', 'ARCHIVED');
CREATE TYPE "RelationalInstitutionalReportingType" AS ENUM (
  'INSTITUTIONAL_OVERVIEW',
  'EXECUTIVE_DIGEST',
  'STRATEGIC_INTELLIGENCE',
  'CORRIDOR_BRIEFING'
);
CREATE TYPE "RelationalInstitutionalReportingPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalInstitutionalReportingSignalType" AS ENUM (
  'INSTITUTIONAL',
  'EXECUTIVE',
  'SYSTEMIC',
  'RESILIENCE',
  'ALIGNMENT'
);
CREATE TYPE "RelationalInstitutionalReportingBriefType" AS ENUM (
  'EXECUTIVE_BRIEF',
  'STRATEGIC_BRIEF',
  'TERRITORIAL_BRIEF',
  'SECTOR_BRIEF',
  'SYSTEMIC_RISK_BRIEF',
  'RESILIENCE_BRIEF',
  'GOVERNANCE_BRIEF'
);
CREATE TYPE "RelationalInstitutionalReportingEventType" AS ENUM (
  'BRIEF_GENERATED',
  'SYSTEMIC_RISK_DETECTED',
  'EXECUTIVE_PRESSURE_DETECTED',
  'PRIORITY_DETECTED',
  'RESILIENCE_DETECTED',
  'SNAPSHOT_ARCHIVED'
);

CREATE TABLE "relational_institutional_reporting_nodes" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "executiveOrchestrationNodeId" UUID,
  "monitoringNodeId" UUID,
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
  "reportingType" "RelationalInstitutionalReportingType" NOT NULL,
  "reportingPriority" "RelationalInstitutionalReportingPriority" NOT NULL,
  "reportingStatus" "RelationalInstitutionalReportingStatus" NOT NULL,
  "severity" "RelationalInstitutionalReportingSeverity" NOT NULL,
  "institutionalScore" INTEGER NOT NULL DEFAULT 0,
  "executiveRisk" INTEGER NOT NULL DEFAULT 0,
  "strategicResilience" INTEGER NOT NULL DEFAULT 0,
  "systemicExposure" INTEGER NOT NULL DEFAULT 0,
  "strategicAlignmentScore" INTEGER NOT NULL DEFAULT 0,
  "governancePressure" INTEGER NOT NULL DEFAULT 0,
  "arbitrationPressure" INTEGER NOT NULL DEFAULT 0,
  "stabilizationPressure" INTEGER NOT NULL DEFAULT 0,
  "monitoringPressure" INTEGER NOT NULL DEFAULT 0,
  "orchestrationPressure" INTEGER NOT NULL DEFAULT 0,
  "recoveryPressure" INTEGER NOT NULL DEFAULT 0,
  "sovereigntyPressure" INTEGER NOT NULL DEFAULT 0,
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
  CONSTRAINT "relational_institutional_reporting_nodes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_institutional_reporting_nodes_nodeCode_key" ON "relational_institutional_reporting_nodes"("nodeCode");
CREATE INDEX "relational_institutional_reporting_nodes_relationshipId_idx" ON "relational_institutional_reporting_nodes"("relationshipId");
CREATE INDEX "relational_institutional_reporting_nodes_institutionalScore_idx" ON "relational_institutional_reporting_nodes"("institutionalScore");
CREATE INDEX "relational_institutional_reporting_nodes_executiveRisk_idx" ON "relational_institutional_reporting_nodes"("executiveRisk");
CREATE INDEX "relational_institutional_reporting_nodes_strategicResilience_idx" ON "relational_institutional_reporting_nodes"("strategicResilience");
CREATE INDEX "relational_institutional_reporting_nodes_systemicExposure_idx" ON "relational_institutional_reporting_nodes"("systemicExposure");
CREATE INDEX "relational_institutional_reporting_nodes_territoryCountry_idx" ON "relational_institutional_reporting_nodes"("territoryCountry");
CREATE INDEX "relational_institutional_reporting_nodes_sectorSlug_idx" ON "relational_institutional_reporting_nodes"("sectorSlug");
CREATE INDEX "relational_institutional_reporting_nodes_reportingPriority_idx" ON "relational_institutional_reporting_nodes"("reportingPriority");
CREATE INDEX "relational_institutional_reporting_nodes_createdAt_idx" ON "relational_institutional_reporting_nodes"("createdAt");

CREATE TABLE "relational_institutional_reporting_signals" (
  "id" UUID NOT NULL,
  "reportingNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalCode" TEXT NOT NULL,
  "signalType" "RelationalInstitutionalReportingSignalType" NOT NULL,
  "intensity" INTEGER NOT NULL DEFAULT 0,
  "pressureLevel" INTEGER NOT NULL DEFAULT 0,
  "riskLevel" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_institutional_reporting_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_institutional_reporting_signals_signalCode_key" ON "relational_institutional_reporting_signals"("signalCode");
CREATE INDEX "relational_institutional_reporting_signals_reportingNodeId_idx" ON "relational_institutional_reporting_signals"("reportingNodeId");
CREATE INDEX "relational_institutional_reporting_signals_relationshipId_idx" ON "relational_institutional_reporting_signals"("relationshipId");
CREATE INDEX "relational_institutional_reporting_signals_signalType_idx" ON "relational_institutional_reporting_signals"("signalType");

CREATE TABLE "relational_institutional_reporting_briefs" (
  "id" UUID NOT NULL,
  "reportingNodeId" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "briefCode" TEXT NOT NULL,
  "briefType" "RelationalInstitutionalReportingBriefType" NOT NULL,
  "severity" "RelationalInstitutionalReportingSeverity" NOT NULL,
  "priority" "RelationalInstitutionalReportingPriority" NOT NULL,
  "title" VARCHAR(400) NOT NULL,
  "summary" VARCHAR(4000) NOT NULL,
  "institutionalPressure" INTEGER NOT NULL DEFAULT 0,
  "systemicExposure" INTEGER NOT NULL DEFAULT 0,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_institutional_reporting_briefs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_institutional_reporting_briefs_briefCode_key" ON "relational_institutional_reporting_briefs"("briefCode");
CREATE INDEX "relational_institutional_reporting_briefs_reportingNodeId_idx" ON "relational_institutional_reporting_briefs"("reportingNodeId");
CREATE INDEX "relational_institutional_reporting_briefs_relationshipId_idx" ON "relational_institutional_reporting_briefs"("relationshipId");
CREATE INDEX "relational_institutional_reporting_briefs_briefType_idx" ON "relational_institutional_reporting_briefs"("briefType");
CREATE INDEX "relational_institutional_reporting_briefs_severity_idx" ON "relational_institutional_reporting_briefs"("severity");

CREATE TABLE "relational_institutional_reporting_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "reportingNodeId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "reportingStatus" "RelationalInstitutionalReportingStatus" NOT NULL,
  "institutionalScore" INTEGER NOT NULL,
  "executiveRisk" INTEGER NOT NULL,
  "strategicResilience" INTEGER NOT NULL,
  "systemicExposure" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_institutional_reporting_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "relational_institutional_reporting_snapshots_snapshotCode_key" ON "relational_institutional_reporting_snapshots"("snapshotCode");
CREATE INDEX "relational_institutional_reporting_snapshots_relationshipId_idx" ON "relational_institutional_reporting_snapshots"("relationshipId");
CREATE INDEX "relational_institutional_reporting_snapshots_institutionalScore_idx" ON "relational_institutional_reporting_snapshots"("institutionalScore");
CREATE INDEX "relational_institutional_reporting_snapshots_createdAt_idx" ON "relational_institutional_reporting_snapshots"("createdAt");

CREATE TABLE "relational_institutional_reporting_events" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "reportingNodeId" UUID,
  "eventType" "RelationalInstitutionalReportingEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_institutional_reporting_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_institutional_reporting_events_relationshipId_idx" ON "relational_institutional_reporting_events"("relationshipId");
CREATE INDEX "relational_institutional_reporting_events_reportingNodeId_idx" ON "relational_institutional_reporting_events"("reportingNodeId");
CREATE INDEX "relational_institutional_reporting_events_eventType_idx" ON "relational_institutional_reporting_events"("eventType");
CREATE INDEX "relational_institutional_reporting_events_createdAt_idx" ON "relational_institutional_reporting_events"("createdAt");

ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_executiveOrchestrationNodeId_fkey" FOREIGN KEY ("executiveOrchestrationNodeId") REFERENCES "relational_executive_orchestration_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_monitoringNodeId_fkey" FOREIGN KEY ("monitoringNodeId") REFERENCES "relational_economic_monitoring_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_stabilizationNodeId_fkey" FOREIGN KEY ("stabilizationNodeId") REFERENCES "relational_economic_stabilization_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_governanceNodeId_fkey" FOREIGN KEY ("governanceNodeId") REFERENCES "relational_economic_governance_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_arbitrationCaseId_fkey" FOREIGN KEY ("arbitrationCaseId") REFERENCES "relational_economic_arbitration_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_recoveryPlanId_fkey" FOREIGN KEY ("recoveryPlanId") REFERENCES "relational_economic_recovery_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_sovereigntyNodeId_fkey" FOREIGN KEY ("sovereigntyNodeId") REFERENCES "relational_economic_sovereignty_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_continuityNodeId_fkey" FOREIGN KEY ("continuityNodeId") REFERENCES "relational_economic_continuity_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_macroEconomicNodeId_fkey" FOREIGN KEY ("macroEconomicNodeId") REFERENCES "relational_macro_economic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_supplyFlowNodeId_fkey" FOREIGN KEY ("supplyFlowNodeId") REFERENCES "relational_supply_flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_geoZoneId_fkey" FOREIGN KEY ("geoZoneId") REFERENCES "relational_geo_economic_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_sectorNodeId_fkey" FOREIGN KEY ("sectorNodeId") REFERENCES "relational_sector_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_nodes" ADD CONSTRAINT "relational_institutional_reporting_nodes_strategicMemoryId_fkey" FOREIGN KEY ("strategicMemoryId") REFERENCES "relational_strategic_memories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_institutional_reporting_signals" ADD CONSTRAINT "relational_institutional_reporting_signals_reportingNodeId_fkey" FOREIGN KEY ("reportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_signals" ADD CONSTRAINT "relational_institutional_reporting_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_institutional_reporting_briefs" ADD CONSTRAINT "relational_institutional_reporting_briefs_reportingNodeId_fkey" FOREIGN KEY ("reportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_briefs" ADD CONSTRAINT "relational_institutional_reporting_briefs_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_institutional_reporting_snapshots" ADD CONSTRAINT "relational_institutional_reporting_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_snapshots" ADD CONSTRAINT "relational_institutional_reporting_snapshots_reportingNodeId_fkey" FOREIGN KEY ("reportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_institutional_reporting_events" ADD CONSTRAINT "relational_institutional_reporting_events_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_institutional_reporting_events" ADD CONSTRAINT "relational_institutional_reporting_events_reportingNodeId_fkey" FOREIGN KEY ("reportingNodeId") REFERENCES "relational_institutional_reporting_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
