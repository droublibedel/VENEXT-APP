import type { PrismaClient } from "@prisma/client";

export const LIVE_ENT_PRODUCER = "ent-live-producer-agronexus";
export const LIVE_ENT_GROSSISTE_A = "ent-live-grossiste-a-nord";

/** Seed LIVE grands comptes (Instruction BACKOFFICE-01-B). */
export async function seedEnterpriseGovernanceLive(prisma: PrismaClient): Promise<number> {
  const existingCompletedSeed = await prisma.enterpriseContractDocumentRecord.count({
    where: { enterpriseId: LIVE_ENT_PRODUCER },
  });
  if (existingCompletedSeed > 0) return 0;

  const now = new Date();
  let n = 0;

  await prisma.enterpriseCommercialChannelRecord.upsert({
    where: { enterpriseId: LIVE_ENT_PRODUCER },
    create: {
      enterpriseId: LIVE_ENT_PRODUCER,
      actorKind: "producteur",
      contractReference: "CTR-LIVE-PROD-2026",
      companyName: "AgroNexus CI — Grand compte",
      headquarters: "Abidjan, Plateau",
      governanceStatus: "ACTIVE",
      activationStatus: "ACTIVE",
      onboardingProgress: 100,
      status: "ACTIVE",
    },
    update: {
      actorKind: "producteur",
      contractReference: "CTR-LIVE-PROD-2026",
      companyName: "AgroNexus CI — Grand compte",
      headquarters: "Abidjan, Plateau",
      governanceStatus: "ACTIVE",
      activationStatus: "ACTIVE",
      onboardingProgress: 100,
      status: "ACTIVE",
    },
  });
  n += 1;

  await prisma.enterpriseCommercialChannelRecord.upsert({
    where: { enterpriseId: LIVE_ENT_GROSSISTE_A },
    create: {
      enterpriseId: LIVE_ENT_GROSSISTE_A,
      actorKind: "grossiste_a",
      contractReference: "CTR-LIVE-GA-2026",
      companyName: "Distribution Nord Plus — Grand compte",
      headquarters: "Bouaké",
      governanceStatus: "CHANNEL_OPEN",
      activationStatus: "ACTIVE",
      onboardingProgress: 80,
      status: "ACTIVE",
    },
    update: {
      actorKind: "grossiste_a",
      contractReference: "CTR-LIVE-GA-2026",
      companyName: "Distribution Nord Plus — Grand compte",
      headquarters: "Bouaké",
      governanceStatus: "CHANNEL_OPEN",
      activationStatus: "ACTIVE",
      onboardingProgress: 80,
      status: "ACTIVE",
    },
  });
  n += 1;

  for (const [enterpriseId, poleId, poleLabel] of [
    [LIVE_ENT_PRODUCER, "executive", "Direction"],
    [LIVE_ENT_PRODUCER, "commercial", "Commercial"],
    [LIVE_ENT_GROSSISTE_A, "executive", "Direction"],
    [LIVE_ENT_GROSSISTE_A, "relational-commercial", "Relationnel"],
  ] as const) {
    await prisma.enterprisePoleActivationRecord.upsert({
      where: { enterpriseId_poleId: { enterpriseId, poleId } },
      create: {
        enterpriseId,
        poleId,
        poleLabel,
        activated: true,
        secureSlug: poleId,
        privateUrl: `https://venext.co/e/${enterpriseId}/${poleId}`,
        status: "ACTIVE",
      },
      update: {
        poleLabel,
        activated: true,
        secureSlug: poleId,
        privateUrl: `https://venext.co/e/${enterpriseId}/${poleId}`,
        status: "ACTIVE",
      },
    });
    n += 1;
  }

  await prisma.enterpriseInvitationRecord.create({
    data: {
      token: `inv-live-${LIVE_ENT_GROSSISTE_A}`,
      enterpriseId: LIVE_ENT_GROSSISTE_A,
      poleId: "relational-commercial",
      poleLabel: "Relationnel",
      activationCode: "LIVE-GA-001",
      status: "PENDING",
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  n += 1;

  await prisma.enterpriseCollaboratorRecord.create({
    data: {
      internalEnterpriseUserId: `ieu-live-${LIVE_ENT_PRODUCER}`,
      enterpriseId: LIVE_ENT_PRODUCER,
      poleId: "commercial",
      firstName: "Awa",
      lastName: "Koné",
      phone: "+2250700100999",
      email: "awa.kone@agronexus.ci",
      status: "ACTIVE",
    },
  });
  n += 1;

  await prisma.enterpriseTrustedDeviceRecord.create({
    data: {
      enterpriseId: LIVE_ENT_PRODUCER,
      deviceLabel: "MacBook Pilotage",
      machineFingerprint: "fp-live-prod-01",
      status: "APPROVED",
    },
  });
  n += 1;

  await prisma.enterpriseSecurityAlertRecord.create({
    data: {
      enterpriseId: LIVE_ENT_GROSSISTE_A,
      alertType: "invitation_expired",
      message: "Invitation relationnelle proche expiration",
      severity: "warning",
      acknowledged: false,
      status: "OPEN",
    },
  });
  n += 1;

  await prisma.enterpriseGovernanceHistoryRecord.create({
    data: {
      enterpriseId: LIVE_ENT_PRODUCER,
      action: "CHANNEL_OPEN",
      author: "seed",
      target: LIVE_ENT_PRODUCER,
      note: "Canal producteur ouvert (seed LIVE)",
      previousState: "DRAFT",
      newState: "ACTIVE",
    },
  });
  n += 1;

  await prisma.enterpriseContractDocumentRecord.create({
    data: {
      enterpriseId: LIVE_ENT_PRODUCER,
      title: "Contrat cadre producteur 2026",
      kind: "contract",
      fileRef: "s3://venext-contracts/live/producer-2026.pdf",
      status: "ACTIVE",
    },
  });
  n += 1;

  return n;
}
