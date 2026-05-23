-- Instruction 20.2 — sponsored commercial discovery (temporary corridor, not marketplace)

CREATE TYPE "TemporaryCommercialHandshakeState" AS ENUM (
  'DISCOVERED',
  'SPONSORED_CONTACT_OPENED',
  'SPONSORED_NEGOTIATION_ACTIVE',
  'RELATIONSHIP_REQUESTED',
  'RELATIONSHIP_ACCEPTED',
  'RELATIONSHIP_REJECTED',
  'SPONSORED_WINDOW_EXPIRED'
);

CREATE TYPE "SponsoredRelationshipRequestState" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED_COMMERCIAL',
  'REJECTED_COMMERCIAL',
  'CANCELLED_BY_REQUESTER'
);

ALTER TYPE "ThreadType" ADD VALUE 'SPONSORED_DISCOVERY_THREAD';

CREATE TABLE "sponsored_commercial_campaigns" (
    "id" UUID NOT NULL,
    "sponsorOrganizationId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "regionScope" TEXT,
    "cityScope" TEXT,
    "districtScope" TEXT,
    "targetActorCategory" "OrganizationCategory",
    "sponsorBudgetSnapshot" JSONB NOT NULL DEFAULT '{}',
    "maxActiveWindowsPerTarget" INTEGER NOT NULL DEFAULT 3,
    "cooldownSeconds" INTEGER NOT NULL DEFAULT 86400,
    "windowDurationHours" INTEGER NOT NULL DEFAULT 168,
    "discoverySource" TEXT NOT NULL DEFAULT 'INTELLIGENCE_PLACEMENT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsored_commercial_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sponsored_conversation_windows" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "sponsorOrganizationId" UUID NOT NULL,
    "targetOrganizationId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "state" "TemporaryCommercialHandshakeState" NOT NULL DEFAULT 'DISCOVERED',
    "regionScope" TEXT,
    "cityScope" TEXT,
    "districtScope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "openedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "convertedToRelationship" BOOLEAN NOT NULL DEFAULT false,
    "relationshipId" UUID,
    "temporaryConversationAllowed" BOOLEAN NOT NULL DEFAULT true,
    "sponsorBudgetSnapshot" JSONB NOT NULL DEFAULT '{}',
    "discoverySource" TEXT NOT NULL DEFAULT 'INTELLIGENCE_PLACEMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsored_conversation_windows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sponsored_relationship_requests" (
    "id" UUID NOT NULL,
    "requesterOrganizationId" UUID NOT NULL,
    "targetOrganizationId" UUID NOT NULL,
    "sponsoredConversationWindowId" UUID NOT NULL,
    "requestState" "SponsoredRelationshipRequestState" NOT NULL DEFAULT 'SUBMITTED',
    "motivation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsored_relationship_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sponsored_exposure_analytics" (
    "id" UUID NOT NULL,
    "sponsorOrganizationId" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "region" TEXT,
    "city" TEXT,
    "district" TEXT,
    "targetActorType" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "conversationsStarted" INTEGER NOT NULL DEFAULT 0,
    "negotiationsTriggered" INTEGER NOT NULL DEFAULT 0,
    "relationshipRequests" INTEGER NOT NULL DEFAULT 0,
    "relationshipAccepted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsored_exposure_analytics_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "sponsored_commercial_campaigns" ADD CONSTRAINT "sponsored_commercial_campaigns_sponsorOrganizationId_fkey" FOREIGN KEY ("sponsorOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_commercial_campaigns" ADD CONSTRAINT "sponsored_commercial_campaigns_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sponsored_conversation_windows" ADD CONSTRAINT "sponsored_conversation_windows_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "sponsored_commercial_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_conversation_windows" ADD CONSTRAINT "sponsored_conversation_windows_sponsorOrganizationId_fkey" FOREIGN KEY ("sponsorOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_conversation_windows" ADD CONSTRAINT "sponsored_conversation_windows_targetOrganizationId_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_conversation_windows" ADD CONSTRAINT "sponsored_conversation_windows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_conversation_windows" ADD CONSTRAINT "sponsored_conversation_windows_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sponsored_relationship_requests" ADD CONSTRAINT "sponsored_relationship_requests_window_fkey" FOREIGN KEY ("sponsoredConversationWindowId") REFERENCES "sponsored_conversation_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_relationship_requests" ADD CONSTRAINT "sponsored_relationship_requests_requester_fkey" FOREIGN KEY ("requesterOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_relationship_requests" ADD CONSTRAINT "sponsored_relationship_requests_target_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sponsored_exposure_analytics" ADD CONSTRAINT "sponsored_exposure_analytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "sponsored_commercial_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_exposure_analytics" ADD CONSTRAINT "sponsored_exposure_analytics_sponsorOrganizationId_fkey" FOREIGN KEY ("sponsorOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "sponsored_commercial_campaigns_sponsor_active_idx" ON "sponsored_commercial_campaigns"("sponsorOrganizationId", "active");
CREATE INDEX "sponsored_commercial_campaigns_product_idx" ON "sponsored_commercial_campaigns"("productId");
CREATE INDEX "sponsored_conversation_windows_campaign_target_idx" ON "sponsored_conversation_windows"("campaignId", "targetOrganizationId");
CREATE INDEX "sponsored_conversation_windows_expires_idx" ON "sponsored_conversation_windows"("expiresAt");
CREATE INDEX "sponsored_relationship_requests_window_idx" ON "sponsored_relationship_requests"("sponsoredConversationWindowId");
CREATE INDEX "sponsored_exposure_analytics_campaign_created_idx" ON "sponsored_exposure_analytics"("campaignId", "createdAt");

ALTER TABLE "message_threads" ADD COLUMN "sponsoredConversationWindowId" UUID;
ALTER TABLE "message_threads" ADD COLUMN "sponsoredDiscoveryMetadata" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "message_threads_sponsored_window_idx" ON "message_threads"("sponsoredConversationWindowId");

ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_sponsoredConversationWindowId_fkey" FOREIGN KEY ("sponsoredConversationWindowId") REFERENCES "sponsored_conversation_windows"("id") ON DELETE SET NULL ON UPDATE CASCADE;
