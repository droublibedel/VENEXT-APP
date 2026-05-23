-- Instruction 20.12 — relational operational intelligence & SLA engine

CREATE TYPE "RelationalOperationalAlertSeverity" AS ENUM (
  'INFO',
  'WARNING',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "RelationalOperationalAlertType" AS ENUM (
  'SLA_DELAY_RISK',
  'REPEATED_INCIDENT_PATTERN',
  'FULFILLMENT_STAGNATION',
  'CORRIDOR_OPERATIONAL_DEGRADATION',
  'UNRESOLVED_BLOCKING_TASKS',
  'REPEATED_RECEPTION_REJECTION',
  'EXECUTION_LATENCY_ANOMALY',
  'PROOF_VALIDATION_DELAY',
  'COORDINATION_OVERLOAD',
  'UNBALANCED_CONFIRMATION_PATTERN'
);

CREATE TYPE "RelationalOperationalMetricType" AS ENUM (
  'EXECUTION_DURATION_HOURS',
  'FULFILLMENT_DURATION_HOURS',
  'INCIDENT_RESOLUTION_DURATION_HOURS',
  'TASK_COMPLETION_DURATION_HOURS',
  'BUYER_CONFIRMATION_DELAY_HOURS',
  'SELLER_CONFIRMATION_DELAY_HOURS',
  'RECEPTION_VALIDATION_DELAY_HOURS'
);

CREATE TABLE "relational_operational_alerts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "orderId" UUID,
  "fulfillmentRecordId" UUID,
  "alertType" "RelationalOperationalAlertType" NOT NULL,
  "severity" "RelationalOperationalAlertSeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "resolutionNotes" TEXT,
  "metadata" JSONB,
  "diagnostics" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_operational_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_operational_metrics" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "orderId" UUID,
  "metricType" "RelationalOperationalMetricType" NOT NULL,
  "metricValue" DOUBLE PRECISION NOT NULL,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_operational_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_operational_alerts_relationshipId_idx" ON "relational_operational_alerts"("relationshipId");
CREATE INDEX "relational_operational_alerts_alertType_idx" ON "relational_operational_alerts"("alertType");
CREATE INDEX "relational_operational_alerts_severity_idx" ON "relational_operational_alerts"("severity");
CREATE INDEX "relational_operational_alerts_resolvedAt_idx" ON "relational_operational_alerts"("resolvedAt");

CREATE INDEX "relational_operational_metrics_relationshipId_idx" ON "relational_operational_metrics"("relationshipId");
CREATE INDEX "relational_operational_metrics_metricType_idx" ON "relational_operational_metrics"("metricType");
CREATE INDEX "relational_operational_metrics_computedAt_idx" ON "relational_operational_metrics"("computedAt");

ALTER TABLE "relational_operational_alerts" ADD CONSTRAINT "relational_operational_alerts_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_operational_alerts" ADD CONSTRAINT "relational_operational_alerts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_operational_metrics" ADD CONSTRAINT "relational_operational_metrics_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_operational_metrics" ADD CONSTRAINT "relational_operational_metrics_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
