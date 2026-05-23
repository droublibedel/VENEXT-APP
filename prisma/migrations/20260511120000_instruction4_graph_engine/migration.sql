-- Instruction 4: nullable commercial edge until ACCEPTED; network code usage; signal enums

ALTER TYPE "EconomicSignalType" ADD VALUE IF NOT EXISTS 'NETWORK_EXPANSION';
ALTER TYPE "EconomicSignalType" ADD VALUE IF NOT EXISTS 'TRUST_SIGNAL';

ALTER TABLE "network_codes" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "network_codes" ADD COLUMN IF NOT EXISTS "joinPolicy" TEXT NOT NULL DEFAULT 'JOIN_CREATES_PENDING';

ALTER TABLE "relationships" ALTER COLUMN "upstreamOrganizationId" DROP NOT NULL;
ALTER TABLE "relationships" ALTER COLUMN "downstreamOrganizationId" DROP NOT NULL;
