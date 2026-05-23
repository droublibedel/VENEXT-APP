-- Instruction 20.3 — commercial relationship governance & trust layer (private heuristics, not public reputation)

CREATE TYPE "CommercialTrustLevel" AS ENUM (
  'UNKNOWN',
  'EMERGING',
  'STABLE',
  'STRATEGIC',
  'HIGH_CONFIDENCE',
  'DEGRADED',
  'RESTRICTED'
);

CREATE TYPE "CommercialTrustSignalType" AS ENUM (
  'NEGOTIATION_STABILITY',
  'RELATIONSHIP_RELIABILITY',
  'SPONSORED_DISCOVERY_CONVERSION',
  'COMMERCIAL_RESPONSIVENESS',
  'HIGH_NEGOTIATION_DROP_RATE',
  'DORMANT_CORRIDOR',
  'SYMBOLIC_RESERVATION_MISMATCH',
  'COMMERCIAL_ALIGNMENT_SIGNAL'
);

CREATE TYPE "CommercialTrustDataConfidence" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

CREATE TYPE "CommercialTrustDirection" AS ENUM (
  'OUTBOUND',
  'INBOUND',
  'BILATERAL'
);

CREATE TABLE "commercial_trust_profiles" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "trustLevel" "CommercialTrustLevel" NOT NULL DEFAULT 'UNKNOWN',
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "relationshipCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedRelationshipCount" INTEGER NOT NULL DEFAULT 0,
    "negotiationCompletionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageNegotiationResponseMinutes" DOUBLE PRECISION,
    "sponsoredConversationConversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dormantRelationshipRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unresolvedNegotiationRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "symbolicReservationReliability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryConsistencySignal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commercialStabilitySignal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataConfidenceLevel" "CommercialTrustDataConfidence" NOT NULL DEFAULT 'LOW',
    "lastComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_trust_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_trust_profiles_organizationId_key" ON "commercial_trust_profiles"("organizationId");

ALTER TABLE "commercial_trust_profiles" ADD CONSTRAINT "commercial_trust_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "commercial_trust_signals" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "signalType" "CommercialTrustSignalType" NOT NULL,
    "signalStrength" DOUBLE PRECISION NOT NULL,
    "heuristicOnly" BOOLEAN NOT NULL DEFAULT true,
    "confidenceLevel" "CommercialTrustDataConfidence" NOT NULL DEFAULT 'LOW',
    "explanation" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commercial_trust_signals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_trust_signals_profileId_signalType_key" ON "commercial_trust_signals"("profileId", "signalType");

CREATE INDEX "commercial_trust_signals_profileId_computedAt_idx" ON "commercial_trust_signals"("profileId", "computedAt");

ALTER TABLE "commercial_trust_signals" ADD CONSTRAINT "commercial_trust_signals_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "commercial_trust_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "commercial_trust_relationship_snapshots" (
    "id" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "relatedOrganizationId" UUID NOT NULL,
    "relationshipId" UUID,
    "relationshipState" "RelationshipStatus" NOT NULL,
    "trustDirection" "CommercialTrustDirection" NOT NULL DEFAULT 'BILATERAL',
    "interactionVolume" INTEGER NOT NULL DEFAULT 0,
    "negotiationCount" INTEGER NOT NULL DEFAULT 0,
    "successfulNegotiationCount" INTEGER NOT NULL DEFAULT 0,
    "sponsoredDiscoveryOrigin" BOOLEAN NOT NULL DEFAULT false,
    "lastInteractionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_trust_relationship_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_trust_relationship_snapshots_profileId_relatedOrganizationId_key" ON "commercial_trust_relationship_snapshots"("profileId", "relatedOrganizationId");

CREATE INDEX "commercial_trust_relationship_snapshots_organizationId_relatedOrganizationId_idx" ON "commercial_trust_relationship_snapshots"("organizationId", "relatedOrganizationId");

ALTER TABLE "commercial_trust_relationship_snapshots" ADD CONSTRAINT "commercial_trust_relationship_snapshots_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "commercial_trust_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commercial_trust_relationship_snapshots" ADD CONSTRAINT "commercial_trust_relationship_snapshots_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
