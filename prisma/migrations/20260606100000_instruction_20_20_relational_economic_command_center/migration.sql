-- Instruction 20.20 — relational economic command center & strategic control layer (supervision only)

CREATE TYPE "RelationalEconomicCommandCenterStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "RelationalEconomicCommandCenterViewType" AS ENUM (
  'SYSTEMIC',
  'SINGLE_CORRIDOR',
  'CLUSTER_PRESSURE',
  'PROPAGATION_HEAT'
);
CREATE TYPE "RelationalEconomicCommandCenterSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicControlPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
CREATE TYPE "RelationalEconomicControlEventType" AS ENUM (
  'SNAPSHOT_CREATED',
  'SYSTEMIC_CLUSTER_DETECTED',
  'CASCADE_RISK_DETECTED',
  'COMMAND_VIEW_REFRESHED',
  'CRITICAL_CORRIDOR_DETECTED',
  'STRATEGIC_PRESSURE_DETECTED'
);

CREATE TABLE "relational_economic_command_center_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID,
  "snapshotCode" TEXT NOT NULL,
  "viewType" "RelationalEconomicCommandCenterViewType" NOT NULL,
  "severity" "RelationalEconomicCommandCenterSeverity" NOT NULL,
  "lifecycleStatus" "RelationalEconomicCommandCenterStatus" NOT NULL DEFAULT 'ACTIVE',
  "globalRiskScore" INTEGER NOT NULL,
  "systemicPressureScore" INTEGER NOT NULL,
  "operationalHealthScore" INTEGER NOT NULL,
  "coordinationStressScore" INTEGER NOT NULL,
  "fulfillmentPressureScore" INTEGER NOT NULL,
  "propagationExposureScore" INTEGER NOT NULL,
  "activeAlertsCount" INTEGER NOT NULL,
  "activeRecommendationsCount" INTEGER NOT NULL,
  "activeOrchestrationsCount" INTEGER NOT NULL,
  "activeSimulationsCount" INTEGER NOT NULL,
  "activeCriticalReviewsCount" INTEGER NOT NULL,
  "activeStrategicMemoriesCount" INTEGER NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "computedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_command_center_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_economic_control_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "snapshotId" UUID,
  "eventType" "RelationalEconomicControlEventType" NOT NULL,
  "actorOrganizationId" UUID NOT NULL,
  "actorUserId" UUID NOT NULL,
  "diagnostics" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "relational_economic_control_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "relational_economic_command_center_snapshots"
  ADD CONSTRAINT "relational_economic_command_center_snapshots_relationshipId_fkey"
  FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "relational_economic_control_events"
  ADD CONSTRAINT "relational_economic_control_events_snapshotId_fkey"
  FOREIGN KEY ("snapshotId") REFERENCES "relational_economic_command_center_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "relational_economic_command_center_snapshots_snapshotCode_key"
  ON "relational_economic_command_center_snapshots"("snapshotCode");
CREATE INDEX "relational_economic_command_center_snapshots_relationshipId_idx"
  ON "relational_economic_command_center_snapshots"("relationshipId");
CREATE INDEX "relational_economic_command_center_snapshots_severity_idx"
  ON "relational_economic_command_center_snapshots"("severity");
CREATE INDEX "relational_economic_command_center_snapshots_globalRiskScore_idx"
  ON "relational_economic_command_center_snapshots"("globalRiskScore");
CREATE INDEX "relational_economic_command_center_snapshots_operationalHealthScore_idx"
  ON "relational_economic_command_center_snapshots"("operationalHealthScore");
CREATE INDEX "relational_economic_command_center_snapshots_propagationExposureScore_idx"
  ON "relational_economic_command_center_snapshots"("propagationExposureScore");
CREATE INDEX "relational_economic_command_center_snapshots_computedAt_idx"
  ON "relational_economic_command_center_snapshots"("computedAt");

CREATE INDEX "relational_economic_control_events_snapshotId_idx"
  ON "relational_economic_control_events"("snapshotId");
CREATE INDEX "relational_economic_control_events_eventType_idx"
  ON "relational_economic_control_events"("eventType");
CREATE INDEX "relational_economic_control_events_createdAt_idx"
  ON "relational_economic_control_events"("createdAt");
