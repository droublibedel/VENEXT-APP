-- Instruction 20.14 — deterministic operational recommendation engine

CREATE TYPE "RelationalOperationalRecommendationSeverity" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE "RelationalOperationalRecommendationType" AS ENUM (
  'SLA_DEGRADATION_RECOMMENDATION',
  'INCIDENT_ESCALATION_RECOMMENDATION',
  'DOCUMENT_VALIDATION_RECOMMENDATION',
  'EXECUTION_STABILIZATION_RECOMMENDATION',
  'FULFILLMENT_RISK_RECOMMENDATION',
  'COORDINATION_OVERLOAD_RECOMMENDATION',
  'CORRIDOR_GOVERNANCE_RECOMMENDATION',
  'COLLAPSE_PREVENTION_RECOMMENDATION',
  'OPERATIONAL_REVIEW_RECOMMENDATION',
  'PARTNER_VALIDATION_RECOMMENDATION'
);

CREATE TYPE "RelationalOperationalRecommendationStatus" AS ENUM (
  'ACTIVE',
  'ACKNOWLEDGED',
  'DISMISSED',
  'RESOLVED',
  'EXPIRED'
);

CREATE TYPE "RelationalOperationalRecommendationSource" AS ENUM (
  'SLA_ANALYSIS',
  'PREDICTIVE_RISK',
  'FULFILLMENT_ANALYSIS',
  'INCIDENT_ANALYSIS',
  'EXECUTION_ANALYSIS',
  'COORDINATION_ANALYSIS',
  'GOVERNANCE_ANALYSIS',
  'CORRIDOR_COLLAPSE_ANALYSIS'
);

CREATE TABLE "relational_operational_recommendations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "relationshipId" UUID NOT NULL,
  "recommendationType" "RelationalOperationalRecommendationType" NOT NULL,
  "severity" "RelationalOperationalRecommendationSeverity" NOT NULL,
  "source" "RelationalOperationalRecommendationSource" NOT NULL,
  "status" "RelationalOperationalRecommendationStatus" NOT NULL DEFAULT 'ACTIVE',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "recommendationCode" TEXT NOT NULL,
  "recommendationDiagnostics" JSONB,
  "recommendationMetadata" JSONB,
  "recommendationScore" INTEGER NOT NULL,
  "confidenceLevel" INTEGER NOT NULL,
  "actionable" BOOLEAN NOT NULL DEFAULT true,
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgedByUserId" UUID,
  "resolvedAt" TIMESTAMP(3),
  "resolvedByUserId" UUID,
  "dismissedAt" TIMESTAMP(3),
  "dismissedByUserId" UUID,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "relational_operational_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "relational_operational_recommendations_relationshipId_idx" ON "relational_operational_recommendations"("relationshipId");
CREATE INDEX "relational_operational_recommendations_severity_idx" ON "relational_operational_recommendations"("severity");
CREATE INDEX "relational_operational_recommendations_status_idx" ON "relational_operational_recommendations"("status");
CREATE INDEX "relational_operational_recommendations_recommendationType_idx" ON "relational_operational_recommendations"("recommendationType");
CREATE INDEX "relational_operational_recommendations_source_idx" ON "relational_operational_recommendations"("source");
CREATE INDEX "relational_operational_recommendations_recommendationCode_idx" ON "relational_operational_recommendations"("recommendationCode");

ALTER TABLE "relational_operational_recommendations" ADD CONSTRAINT "relational_operational_recommendations_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
