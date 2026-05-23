-- Instruction 18.3 — economic scenario engine persistence (industrial projection, not ERP).

CREATE TABLE "economic_scenarios" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "scenarioCode" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "sourcePole" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "affectedPoles" JSONB NOT NULL DEFAULT '[]',
    "affectedTerritories" JSONB NOT NULL DEFAULT '[]',
    "projectedRisk" DOUBLE PRECISION NOT NULL,
    "stabilizationProbability" DOUBLE PRECISION NOT NULL,
    "estimatedPropagationDepth" INTEGER NOT NULL,
    "trajectory" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "economic_scenarios_organizationId_scenarioType_key" ON "economic_scenarios"("organizationId", "scenarioType");
CREATE INDEX "economic_scenarios_organizationId_createdAt_idx" ON "economic_scenarios"("organizationId", "createdAt");

CREATE TABLE "economic_scenario_trajectories" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "systemicRisk" DOUBLE PRECISION NOT NULL,
    "unstableTerritories" JSONB NOT NULL DEFAULT '[]',
    "impactedPoles" JSONB NOT NULL DEFAULT '[]',
    "stabilizationTrend" TEXT NOT NULL,
    "volatilityShift" TEXT NOT NULL,
    "propagationAcceleration" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "economic_scenario_trajectories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "economic_scenario_trajectories_scenarioId_stepIndex_idx" ON "economic_scenario_trajectories"("scenarioId", "stepIndex");
ALTER TABLE "economic_scenario_trajectories" ADD CONSTRAINT "economic_scenario_trajectories_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "economic_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "economic_scenario_impacts" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "targetPole" TEXT NOT NULL,
    "impactKind" TEXT NOT NULL,
    "intensity" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceSignals" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "economic_scenario_impacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "economic_scenario_impacts_scenarioId_idx" ON "economic_scenario_impacts"("scenarioId");
ALTER TABLE "economic_scenario_impacts" ADD CONSTRAINT "economic_scenario_impacts_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "economic_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "economic_scenario_comparisons" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "scenarioAId" TEXT NOT NULL,
    "scenarioBId" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "escalationGap" DOUBLE PRECISION NOT NULL,
    "stabilizationGap" DOUBLE PRECISION NOT NULL,
    "systemicDifference" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_scenario_comparisons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "economic_scenario_comparisons_organizationId_createdAt_idx" ON "economic_scenario_comparisons"("organizationId", "createdAt");
ALTER TABLE "economic_scenario_comparisons" ADD CONSTRAINT "economic_scenario_comparisons_scenarioAId_fkey" FOREIGN KEY ("scenarioAId") REFERENCES "economic_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "economic_scenario_comparisons" ADD CONSTRAINT "economic_scenario_comparisons_scenarioBId_fkey" FOREIGN KEY ("scenarioBId") REFERENCES "economic_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
