-- Instruction 20.4 — commercial corridor governance & intelligence (private, non-marketplace).

CREATE TYPE "CommercialCorridorState" AS ENUM (
  'INVITED',
  'PENDING_REVIEW',
  'ACCEPTED',
  'ACTIVE',
  'DEGRADED',
  'DORMANT',
  'RESTRICTED',
  'SUSPENDED',
  'BLOCKED',
  'TERMINATED'
);

CREATE TYPE "CommercialCorridorVisibility" AS ENUM (
  'STRICT_PRIVATE',
  'PARTNER_ONLY',
  'INTERNAL_ANALYTICS',
  'BACKOFFICE_ONLY'
);

CREATE TYPE "CommercialCorridorSignalType" AS ENUM (
  'STABLE_ORDER_FLOW',
  'HIGH_NEGOTIATION_FRICTION',
  'DORMANT_CORRIDOR',
  'STRONG_PAYMENT_DISCIPLINE',
  'DELIVERY_INSTABILITY',
  'TRUST_DEGRADATION',
  'SPONSORED_CONVERSION_SUCCESS',
  'HIGH_ORDER_CANCELLATION',
  'RAPID_CORRIDOR_GROWTH',
  'LOW_ACTIVITY_WARNING',
  'RELATIONSHIP_CONFLICT_PATTERN',
  'COMMERCIAL_ALIGNMENT_STABLE'
);

ALTER TABLE "relationships" ADD COLUMN "corridorState" "CommercialCorridorState" NOT NULL DEFAULT 'INVITED';
ALTER TABLE "relationships" ADD COLUMN "corridorActivatedAt" TIMESTAMP(3);
ALTER TABLE "relationships" ADD COLUMN "corridorLastActivityAt" TIMESTAMP(3);
ALTER TABLE "relationships" ADD COLUMN "corridorHealthScore" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "relationships" ADD COLUMN "corridorVisibilityLevel" "CommercialCorridorVisibility" NOT NULL DEFAULT 'STRICT_PRIVATE';
ALTER TABLE "relationships" ADD COLUMN "corridorEconomicImportance" DOUBLE PRECISION NOT NULL DEFAULT 0.55;
ALTER TABLE "relationships" ADD COLUMN "corridorDiagnostics" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "relationships_corridorState_idx" ON "relationships"("corridorState");

UPDATE "relationships" SET "corridorState" = 'ACTIVE', "corridorHealthScore" = 55 WHERE "status" = 'ACCEPTED';
UPDATE "relationships" SET "corridorState" = 'INVITED' WHERE "status" = 'PENDING';
UPDATE "relationships" SET "corridorState" = 'TERMINATED' WHERE "status" = 'REJECTED';
UPDATE "relationships" SET "corridorState" = 'BLOCKED' WHERE "status" = 'BLOCKED';
UPDATE "relationships" SET "corridorState" = 'SUSPENDED' WHERE "status" = 'SUSPENDED';

CREATE TABLE "commercial_corridor_signals" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "signalType" "CommercialCorridorSignalType" NOT NULL,
  "signalStrength" DOUBLE PRECISION NOT NULL,
  "explanation" VARCHAR(4000) NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "heuristicOnly" BOOLEAN NOT NULL DEFAULT true,
  "sourceCounters" JSONB NOT NULL DEFAULT '{}',
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commercial_corridor_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_corridor_signals_relationshipId_signalType_key" ON "commercial_corridor_signals"("relationshipId", "signalType");
CREATE INDEX "commercial_corridor_signals_relationshipId_idx" ON "commercial_corridor_signals"("relationshipId");

ALTER TABLE "commercial_corridor_signals" ADD CONSTRAINT "commercial_corridor_signals_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "commercial_corridor_snapshots" (
  "id" UUID NOT NULL,
  "relationshipId" UUID NOT NULL,
  "healthScore" INTEGER NOT NULL,
  "riskBand" VARCHAR(16) NOT NULL,
  "corridorState" "CommercialCorridorState" NOT NULL,
  "signalsDigest" JSONB NOT NULL DEFAULT '{}',
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commercial_corridor_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_corridor_snapshots_relationshipId_key" ON "commercial_corridor_snapshots"("relationshipId");

ALTER TABLE "commercial_corridor_snapshots" ADD CONSTRAINT "commercial_corridor_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
