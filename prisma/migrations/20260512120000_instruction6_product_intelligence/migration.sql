-- Instruction 6: living commerce — economic states, traceability, recalls, group buying, sponsored injections

CREATE TYPE "CommercialTemperature" AS ENUM ('COLD', 'STABLE', 'ACTIVE', 'HOT', 'CRITICAL');

CREATE TYPE "GroupBuyingStatus" AS ENUM ('OPEN', 'COMPLETED', 'FAILED', 'CONVERTED_TO_ORDER');

CREATE TYPE "RecallSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "product_economic_states" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "activeDiscussionCount" INTEGER NOT NULL DEFAULT 0,
    "negotiationCount" INTEGER NOT NULL DEFAULT 0,
    "recentOrderCount" INTEGER NOT NULL DEFAULT 0,
    "demandVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockTensionLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sponsoredScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "freshnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "movementIntensity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeRetailerInterest" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commercialTemperature" "CommercialTemperature" NOT NULL DEFAULT 'STABLE',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_economic_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_economic_states_productId_key" ON "product_economic_states"("productId");

CREATE INDEX "product_economic_states_commercialTemperature_idx" ON "product_economic_states"("commercialTemperature");

ALTER TABLE "product_economic_states" ADD CONSTRAINT "product_economic_states_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "product_traceability" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "lotNumber" TEXT,
    "barcode" TEXT,
    "productionDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "traceabilityEnabled" BOOLEAN NOT NULL DEFAULT false,
    "recallEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_traceability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_traceability_productId_key" ON "product_traceability"("productId");

ALTER TABLE "product_traceability" ADD CONSTRAINT "product_traceability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "recall_events" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "lotNumber" TEXT,
    "severity" "RecallSeverity" NOT NULL,
    "affectedZones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recallReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recall_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recall_events_productId_createdAt_idx" ON "recall_events"("productId", "createdAt");

ALTER TABLE "recall_events" ADD CONSTRAINT "recall_events_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "group_buying_sessions" (
    "id" UUID NOT NULL,
    "initiatorOrganizationId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "relationshipId" UUID,
    "targetQuantity" DECIMAL(18,4) NOT NULL,
    "currentQuantity" DECIMAL(18,4) NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "GroupBuyingStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_buying_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "group_buying_sessions_status_expiresAt_idx" ON "group_buying_sessions"("status", "expiresAt");

CREATE INDEX "group_buying_sessions_productId_idx" ON "group_buying_sessions"("productId");

ALTER TABLE "group_buying_sessions" ADD CONSTRAINT "group_buying_sessions_initiatorOrganizationId_fkey" FOREIGN KEY ("initiatorOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_buying_sessions" ADD CONSTRAINT "group_buying_sessions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "group_buying_sessions" ADD CONSTRAINT "group_buying_sessions_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "sponsored_product_injections" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sponsorOrganizationId" UUID NOT NULL,
    "targetCommercialCategory" TEXT NOT NULL,
    "relationshipId" UUID,
    "maxRelationshipDepth" INTEGER NOT NULL DEFAULT 2,
    "relevanceFloor" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsored_product_injections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sponsored_product_injections_targetCommercialCategory_idx" ON "sponsored_product_injections"("targetCommercialCategory");

CREATE INDEX "sponsored_product_injections_sponsorOrganizationId_idx" ON "sponsored_product_injections"("sponsorOrganizationId");

ALTER TABLE "sponsored_product_injections" ADD CONSTRAINT "sponsored_product_injections_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sponsored_product_injections" ADD CONSTRAINT "sponsored_product_injections_sponsorOrganizationId_fkey" FOREIGN KEY ("sponsorOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sponsored_product_injections" ADD CONSTRAINT "sponsored_product_injections_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
