/**
 * Instruction 20.79-A — seed fondations commerce (PostgreSQL).
 * Usage: npm run commerce:seed
 */
import { PrismaClient, OrganizationCategory } from "@prisma/client";

import { buildCommerceFoundationDemoSeed } from "../services/core-domain-service/src/modules/commerce-foundation-persistence/demo/commerce-foundation-demo.seed";
import { seedEnterpriseGovernanceLive } from "../services/core-domain-service/src/modules/enterprise-governance-live/enterprise-governance-live.seed";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.commerceFoundationRecord.count({
    where: { entityType: "ActorProfile", deletedAt: null },
  });
  if (existing === 0) {
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
  } else {
    console.log(`[commerce:seed] déjà ${existing} profils — skip (utilisez commerce:reset)`);
  }

  const govN = await seedEnterpriseGovernanceLive(prisma);
  if (govN > 0) {
    console.log(`[commerce:seed] ${govN} enregistrements gouvernance grands comptes LIVE`);
  }

  await seedArchi05MarketCatalog(prisma);
}

async function seedArchi05MarketCatalog(prisma: PrismaClient) {
  const ownershipCount = await prisma.catalogueOwnership.count();
  if (ownershipCount >= 3) return;

  const producer = await prisma.organization.findFirst({
    where: { category: OrganizationCategory.PRODUCER },
    select: { id: true },
  });
  const wholesaler = await prisma.organization.findFirst({
    where: { category: OrganizationCategory.WHOLESALER_B },
    select: { id: true },
  });
  const retailer = await prisma.organization.findFirst({
    where: { category: OrganizationCategory.RETAILER },
    select: { id: true },
  });

  if (!producer || !wholesaler || !retailer) {
    console.log("[commerce:seed] ARCHI-05 skip — organizations missing (run prisma db seed)");
    return;
  }

  const orgs = [
    { id: producer.id, role: "PRODUCER", hasCatalogue: true, hasMarket: false },
    { id: wholesaler.id, role: "WHOLESALER", hasCatalogue: true, hasMarket: true },
    { id: retailer.id, role: "RETAILER", hasCatalogue: false, hasMarket: true },
  ];

  for (const org of orgs) {
    await prisma.catalogueOwnership.upsert({
      where: { organizationId: org.id },
      create: {
        organizationId: org.id,
        actorRole: org.role,
        hasCatalogue: org.hasCatalogue,
        hasMarket: org.hasMarket,
      },
      update: { actorRole: org.role, hasCatalogue: org.hasCatalogue, hasMarket: org.hasMarket },
    });
  }

  const producerProducts = await prisma.product.findMany({
    where: { organizationId: producer.id },
    take: 5,
  });

  for (const p of producerProducts) {
    for (const viewerId of [wholesaler.id, retailer.id]) {
      const exists = await prisma.productMarketProjection.findFirst({
        where: { viewerOrganizationId: viewerId, sourceProductId: p.id },
      });
      if (exists) continue;
      await prisma.productMarketProjection.create({
        data: {
          viewerOrganizationId: viewerId,
          sourceProductId: p.id,
          sourceOrganizationId: producer.id,
          supplierDisplayName: viewerId === wholesaler.id ? "Producteur partenaire" : "Grossiste",
          name: p.name,
          description: p.description,
          imageUrls: p.imageUrls,
          unitLabel: p.unitLabel,
          basePrice: p.basePrice,
          currency: p.currency,
          tags: [p.category],
        },
      });
    }
  }

  console.log("[commerce:seed] ARCHI-05 catalogue/market ownership + projections seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
