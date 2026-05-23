-- Instruction 20.79 / 20.79-A — commerce foundation JSON persistence

CREATE TABLE IF NOT EXISTS "commerce_foundation_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityType" VARCHAR(64) NOT NULL,
    "entityKey" VARCHAR(128) NOT NULL,
    "organizationId" VARCHAR(64),
    "relationshipId" VARCHAR(64),
    "actorRole" VARCHAR(32),
    "payload" JSONB NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commerce_foundation_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "commerce_foundation_records_entityType_entityKey_key"
ON "commerce_foundation_records"("entityType", "entityKey");

CREATE INDEX IF NOT EXISTS "commerce_foundation_records_entityType_organizationId_idx"
ON "commerce_foundation_records"("entityType", "organizationId");

CREATE INDEX IF NOT EXISTS "commerce_foundation_records_entityType_relationshipId_idx"
ON "commerce_foundation_records"("entityType", "relationshipId");

CREATE INDEX IF NOT EXISTS "commerce_foundation_records_actorRole_idx"
ON "commerce_foundation_records"("actorRole");
