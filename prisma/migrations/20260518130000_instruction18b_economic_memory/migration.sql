-- Instruction 18.2 — industrial economic memory layer (not ERP, not raw logs).

CREATE TABLE "economic_event_memories" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "territory" TEXT,
    "pole" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceSignals" JSONB NOT NULL DEFAULT '[]',
    "propagationDepth" INTEGER,
    "affectedPoles" JSONB NOT NULL DEFAULT '[]',
    "affectedTerritories" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_event_memories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "economic_event_memories_organizationId_createdAt_idx" ON "economic_event_memories"("organizationId", "createdAt");
CREATE INDEX "economic_event_memories_organizationId_eventType_idx" ON "economic_event_memories"("organizationId", "eventType");

CREATE TABLE "economic_propagation_memories" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "territory" TEXT,
    "pole" TEXT NOT NULL,
    "eventType" TEXT NOT NULL DEFAULT 'propagation_chain',
    "rootShockType" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "impactPath" JSONB NOT NULL DEFAULT '[]',
    "durationEstimate" INTEGER,
    "stabilized" BOOLEAN NOT NULL DEFAULT false,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceSignals" JSONB NOT NULL DEFAULT '[]',
    "propagationDepth" INTEGER NOT NULL,
    "affectedPoles" JSONB NOT NULL DEFAULT '[]',
    "affectedTerritories" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_propagation_memories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "economic_propagation_memories_organizationId_createdAt_idx" ON "economic_propagation_memories"("organizationId", "createdAt");
CREATE INDEX "economic_propagation_memories_organizationId_rootShockType_idx" ON "economic_propagation_memories"("organizationId", "rootShockType");

CREATE TABLE "economic_crisis_signatures" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "territory" TEXT,
    "pole" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'crisis_signature',
    "signatureCode" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "systemicRisk" DOUBLE PRECISION NOT NULL,
    "recurrenceProbability" DOUBLE PRECISION NOT NULL,
    "similarityIndex" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,
    "affectedPoles" JSONB NOT NULL DEFAULT '[]',
    "affectedTerritories" JSONB NOT NULL DEFAULT '[]',
    "recommendedPriority" TEXT NOT NULL,
    "sourceSignals" JSONB NOT NULL DEFAULT '[]',
    "propagationDepth" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_crisis_signatures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "economic_crisis_signatures_organizationId_createdAt_idx" ON "economic_crisis_signatures"("organizationId", "createdAt");
CREATE INDEX "economic_crisis_signatures_organizationId_signatureCode_idx" ON "economic_crisis_signatures"("organizationId", "signatureCode");

CREATE TABLE "economic_temporal_snapshots" (
    "id" TEXT NOT NULL,
    "organizationId" UUID NOT NULL,
    "territory" TEXT,
    "pole" TEXT NOT NULL DEFAULT '_rollup_',
    "eventType" TEXT NOT NULL DEFAULT 'temporal_snapshot',
    "severity" TEXT NOT NULL DEFAULT 'MODERATE',
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceSignals" JSONB NOT NULL DEFAULT '[]',
    "propagationDepth" INTEGER,
    "affectedPoles" JSONB NOT NULL DEFAULT '[]',
    "affectedTerritories" JSONB NOT NULL DEFAULT '[]',
    "trendDirection" TEXT NOT NULL,
    "volatilityLevel" TEXT NOT NULL,
    "accelerationFactor" DOUBLE PRECISION NOT NULL,
    "stabilizationProbability" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "economic_temporal_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "economic_temporal_snapshots_organizationId_createdAt_idx" ON "economic_temporal_snapshots"("organizationId", "createdAt");
