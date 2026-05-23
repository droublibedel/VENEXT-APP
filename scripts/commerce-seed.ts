/**
 * Instruction 20.79-A — seed fondations commerce (PostgreSQL).
 * Usage: npm run commerce:seed
 */
import { PrismaClient } from "@prisma/client";

import { buildCommerceFoundationDemoSeed } from "../services/core-domain-service/src/modules/commerce-foundation-persistence/demo/commerce-foundation-demo.seed";
import { seedEnterpriseGovernanceLive } from "../services/core-domain-service/src/modules/enterprise-governance-live/enterprise-governance-live.seed";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.commerceFoundationRecord.count({
    where: { entityType: "ActorProfile", deletedAt: null },
  });
  if (existing > 0) {
    console.log(`[commerce:seed] déjà ${existing} profils — skip (utilisez commerce:reset)`);
    return;
  }
  const seed = buildCommerceFoundationDemoSeed();
  for (const row of seed) {
    await prisma.commerceFoundationRecord.upsert({
      where: { entityType_entityKey: { entityType: row.entityType, entityKey: row.entityKey } },
      create: {
        entityType: row.entityType,
        entityKey: row.entityKey,
        organizationId: row.organizationId ?? null,
        relationshipId: row.relationshipId ?? null,
        actorRole: row.actorRole ?? null,
        payload: row.payload as object,
      },
      update: {
        payload: row.payload as object,
        organizationId: row.organizationId ?? undefined,
        relationshipId: row.relationshipId ?? undefined,
        actorRole: row.actorRole ?? undefined,
        deletedAt: null,
      },
    });
  }
  console.log(`[commerce:seed] ${seed.length} enregistrements insérés`);
  const govN = await seedEnterpriseGovernanceLive(prisma);
  if (govN > 0) {
    console.log(`[commerce:seed] ${govN} enregistrements gouvernance grands comptes LIVE`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
