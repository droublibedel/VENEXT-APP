-- Instruction 20.13 — deterministic predictive operational risk & drift engine

CREATE TYPE "RelationalPredictiveRiskLevel" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "RelationalPredictiveRiskType" AS ENUM (
  'FULFILLMENT_DELAY_PROBABILITY',
  'INCIDENT_ESCALATION_RISK',
  'CORRIDOR_INSTABILITY_RISK',
  'COORDINATION_SATURATION_RISK',
  'EXECUTION_BREAKDOWN_RISK',
  'RECEPTION_REJECTION_RISK',
  'BLOCKING_TASK_ACCUMULATION',
  'OPERATIONAL_DRIFT_DETECTED',
  'SLA_COLLAPSE_RISK',
  'REPEATED_DEGRADATION_PATTERN'
);

CREATE TYPE "RelationalOperationalDriftType" AS ENUM (
  'EXECUTION_SLOWDOWN',
  'FULFILLMENT_SLOWDOWN',
  'INCIDENT_ACCELERATION',
  'CONFIRMATION_LATENCY_INCREASE',
  'BLOCKING_TASK_GROWTH',
  'CORRIDOR_STABILITY_DECREASE'
);

CREATE TABLE "relational_predictive_risk_signals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "orderId" UUID,
  "riskType" "RelationalPredictiveRiskType" NOT NULL,
  "riskLevel" "RelationalPredictiveRiskLevel" NOT NULL,
  "driftType" "RelationalOperationalDriftType",
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "signalScore" DOUBLE PRECISION NOT NULL,
  "confidenceLevel" DOUBLE PRECISION NOT NULL,
  "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "diagnostics" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_predictive_risk_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_operational_drift_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "driftType" "RelationalOperationalDriftType" NOT NULL,
  "baselineMetric" DOUBLE PRECISION NOT NULL,
  "currentMetric" DOUBLE PRECISION NOT NULL,
  "deviationPercentage" DOUBLE PRECISION NOT NULL,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_operational_drift_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_predictive_risk_signals_relationshipId_idx" ON "relational_predictive_risk_signals"("relationshipId");
CREATE INDEX "relational_predictive_risk_signals_riskType_idx" ON "relational_predictive_risk_signals"("riskType");
CREATE INDEX "relational_predictive_risk_signals_riskLevel_idx" ON "relational_predictive_risk_signals"("riskLevel");
CREATE INDEX "relational_predictive_risk_signals_detectedAt_idx" ON "relational_predictive_risk_signals"("detectedAt");

CREATE INDEX "relational_operational_drift_snapshots_relationshipId_idx" ON "relational_operational_drift_snapshots"("relationshipId");
CREATE INDEX "relational_operational_drift_snapshots_driftType_idx" ON "relational_operational_drift_snapshots"("driftType");
CREATE INDEX "relational_operational_drift_snapshots_computedAt_idx" ON "relational_operational_drift_snapshots"("computedAt");

ALTER TABLE "relational_predictive_risk_signals" ADD CONSTRAINT "relational_predictive_risk_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_predictive_risk_signals" ADD CONSTRAINT "relational_predictive_risk_signals_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "relational_operational_drift_snapshots" ADD CONSTRAINT "relational_operational_drift_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
