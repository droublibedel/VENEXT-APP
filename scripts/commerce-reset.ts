/**
 * Instruction 20.79-A — reset démo fondations commerce.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ENTITY_TYPES = [
  "ActorProfile",
  "CommercialRelationship",
  "RelationalCatalog",
  "CommercialOrder",
  "CommercialDelivery",
  "CommercialSettlement",
  "CommerceMessageThread",
  "ProfessionalMailThread",
  "CommercialContextState",
  "FeatureFlagState",
  "WalletDemoState",
];

async function main() {
  const result = await prisma.commerceFoundationRecord.updateMany({
    where: { entityType: { in: ENTITY_TYPES }, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  console.log(`[commerce:reset] ${result.count} enregistrements marqués supprimés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
