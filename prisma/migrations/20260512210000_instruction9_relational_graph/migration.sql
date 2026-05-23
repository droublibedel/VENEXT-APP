-- Instruction 9 — relational graph metadata, contact snapshots, commercial badges

ALTER TYPE "RelationshipStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE "RelationshipSource" ADD VALUE IF NOT EXISTS 'QR_RELATIONSHIP_JOIN';

ALTER TABLE "relationships" ADD COLUMN IF NOT EXISTS "trustLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.55;
ALTER TABLE "relationships" ADD COLUMN IF NOT EXISTS "commerceCategory" TEXT NOT NULL DEFAULT '';
ALTER TABLE "relationships" ADD COLUMN IF NOT EXISTS "visibilityPermissions" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "commercial_badges" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "user_contact_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "normalizedPhone" VARCHAR(24) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_contact_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_contact_snapshots_userId_normalizedPhone_key" ON "user_contact_snapshots"("userId", "normalizedPhone");
CREATE INDEX IF NOT EXISTS "user_contact_snapshots_normalizedPhone_idx" ON "user_contact_snapshots"("normalizedPhone");

DO $$
BEGIN
  ALTER TABLE "user_contact_snapshots" ADD CONSTRAINT "user_contact_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
