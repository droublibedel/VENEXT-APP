-- Instruction 20.16 — deterministic operational simulation engine (no real mutations)

CREATE TYPE "RelationalOperationalSimulationStatus" AS ENUM (
  'DRAFT',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE "RelationalOperationalSimulationType" AS ENUM (
  'SLA_STRESS_TEST',
  'CORRIDOR_DEGRADATION',
  'INCIDENT_ESCALATION',
  'EXECUTION_SATURATION',
  'FULFILLMENT_DISRUPTION',
  'COORDINATION_OVERLOAD',
  'COLLAPSE_PROPAGATION',
  'GOVERNANCE_BREAKDOWN',
  'PARTNER_FAILURE',
  'MULTI_CORRIDOR_STRESS'
);

CREATE TYPE "RelationalOperationalSimulationSeverity" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "RelationalOperationalSimulationOutcome" AS ENUM (
  'STABLE',
  'DEGRADED',
  'HIGH_RISK',
  'COLLAPSE_RISK',
  'RECOVERY_POSSIBLE',
  'RECOVERY_UNLIKELY'
);

CREATE TABLE "relational_operational_simulations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "simulationType" "RelationalOperationalSimulationType" NOT NULL,
  "status" "RelationalOperationalSimulationStatus" NOT NULL DEFAULT 'DRAFT',
  "severity" "RelationalOperationalSimulationSeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "simulationCode" TEXT NOT NULL,
  "simulationDiagnostics" JSONB,
  "simulationMetadata" JSONB,
  "expectedRiskScore" INTEGER NOT NULL,
  "resultingRiskScore" INTEGER,
  "outcome" "RelationalOperationalSimulationOutcome",
  "deterministic" BOOLEAN NOT NULL DEFAULT true,
  "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_operational_simulations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_operational_simulation_scenarios" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "simulationId" UUID NOT NULL,
  "scenarioCode" TEXT NOT NULL,
  "scenarioTitle" TEXT NOT NULL,
  "scenarioDescription" TEXT NOT NULL,
  "scenarioOrder" INTEGER NOT NULL,
  "assumptions" JSONB,
  "expectedEffects" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_operational_simulation_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "relational_operational_simulation_results" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "simulationId" UUID NOT NULL,
  "resultCode" TEXT NOT NULL,
  "resultTitle" TEXT NOT NULL,
  "resultDescription" TEXT NOT NULL,
  "calculatedRiskScore" INTEGER NOT NULL,
  "projectedSlaImpact" DOUBLE PRECISION NOT NULL,
  "projectedOperationalImpact" DOUBLE PRECISION NOT NULL,
  "projectedCorridorState" TEXT NOT NULL,
  "recommendations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "relational_operational_simulation_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_operational_simulations_relationshipId_idx" ON "relational_operational_simulations"("relationshipId");
CREATE INDEX "relational_operational_simulations_simulationType_idx" ON "relational_operational_simulations"("simulationType");
CREATE INDEX "relational_operational_simulations_status_idx" ON "relational_operational_simulations"("status");
CREATE INDEX "relational_operational_simulations_severity_idx" ON "relational_operational_simulations"("severity");
CREATE INDEX "relational_operational_simulations_outcome_idx" ON "relational_operational_simulations"("outcome");
CREATE INDEX "relational_operational_simulations_simulationCode_idx" ON "relational_operational_simulations"("simulationCode");

CREATE INDEX "relational_operational_simulation_scenarios_simulationId_idx" ON "relational_operational_simulation_scenarios"("simulationId");
CREATE INDEX "relational_operational_simulation_results_simulationId_idx" ON "relational_operational_simulation_results"("simulationId");

ALTER TABLE "relational_operational_simulations" ADD CONSTRAINT "relational_operational_simulations_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_operational_simulation_scenarios" ADD CONSTRAINT "relational_operational_simulation_scenarios_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "relational_operational_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "relational_operational_simulation_results" ADD CONSTRAINT "relational_operational_simulation_results_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "relational_operational_simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
