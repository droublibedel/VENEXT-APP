-- Instruction 20.2A — sponsored discovery hardening (analytics upsert key, request state, negotiation safety support)

ALTER TYPE "SponsoredRelationshipRequestState" ADD VALUE 'RELATIONSHIP_ACCEPTED_SYNCED';

ALTER TABLE "sponsored_exposure_analytics" ADD COLUMN IF NOT EXISTS "aggregationKey" TEXT;
ALTER TABLE "sponsored_exposure_analytics" ADD COLUMN IF NOT EXISTS "eventType" TEXT NOT NULL DEFAULT 'IMPRESSION';
ALTER TABLE "sponsored_exposure_analytics" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "sponsored_exposure_analytics"
SET
  "aggregationKey" = COALESCE("aggregationKey", id::text),
  "eventType" = CASE
    WHEN "opens" > 0 OR "conversationsStarted" > 0 THEN 'OPEN'
    WHEN "relationshipRequests" > 0 THEN 'RELATIONSHIP_REQUEST'
    ELSE 'IMPRESSION'
  END
WHERE "aggregationKey" IS NULL;

ALTER TABLE "sponsored_exposure_analytics" ALTER COLUMN "aggregationKey" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "sponsored_exposure_analytics_aggregationKey_key" ON "sponsored_exposure_analytics" ("aggregationKey");
