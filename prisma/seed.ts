import {
  PrismaClient,
  OrganizationActorType,
  OrganizationCategory,
  OrganizationVerificationStatus,
  OrgMemberRole,
  OrgMemberStatus,
  PreferredLanguage,
  UserStatus,
  RelationshipStatus,
  RelationshipSource,
  CatalogType,
  CatalogVisibilityMode,
  StockStatus,
  PaymentMode,
  QualityBadge,
  ProductVisibilityType,
  OrderDirection,
  OrderStatus,
  PaymentStatus,
  DeliveryStatus,
  NegotiationStatus,
  ThreadType,
  MessageType,
  TransactionType,
  TransactionStatus,
  FeatureFlagScopeType,
  EconomicSignalType,
  EconomicSignalSource,
  WalletStatus,
  OrgMemberPole,
  ContactSuggestionReason,
  ContactSuggestionSource,
  ContactSuggestionStatus,
  CommercialTemperature,
  GroupBuyingStatus,
  RecallSeverity,
  ReservationIntentSource,
  ReservationIntentStatus,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const d = (n: string | number) => new Prisma.Decimal(n);

/** Fixed UUIDs for reproducible local / test environments */
const I = {
  uProd: "21111111-1111-1111-1111-111111111101",
  uWA: "21111111-1111-1111-1111-111111111102",
  uWB1: "21111111-1111-1111-1111-111111111103",
  uWB2: "21111111-1111-1111-1111-111111111104",
  uR1: "21111111-1111-1111-1111-111111111201",
  uR2: "21111111-1111-1111-1111-111111111202",
  uR3: "21111111-1111-1111-1111-111111111203",
  oProd: "31111111-1111-1111-1111-111111111101",
  oWA: "31111111-1111-1111-1111-111111111102",
  oWB1: "31111111-1111-1111-1111-111111111103",
  oWB2: "31111111-1111-1111-1111-111111111104",
  oR1: "31111111-1111-1111-1111-111111111201",
  oR2: "31111111-1111-1111-1111-111111111202",
  oR3: "31111111-1111-1111-1111-111111111203",
  rProdWA: "41111111-1111-1111-1111-111111111001",
  rProdWB1: "41111111-1111-1111-1111-111111111002",
  rWAR1: "41111111-1111-1111-1111-111111111003",
  rWB1R2: "41111111-1111-1111-1111-111111111004",
  rWAR3: "41111111-1111-1111-1111-111111111005",
  rWAWB1: "41111111-1111-4111-8111-111111111039",
  relBlockedWA_WB2: "41111111-1111-4111-8111-111111111041",
  relSusp: "41111111-1111-4111-8111-111111111020",
  ucsWB1: "2a111111-1111-4111-8111-111111111001",
  ucsR3: "2a111111-1111-4111-8111-111111111002",
  /** Instruction 4 — pending / rejected graph demos */
  pendR3WB2: "41111111-1111-1111-1111-111111111010",
  pendWB2WA: "41111111-1111-1111-1111-111111111011",
  pendWAWB1: "41111111-1111-1111-1111-111111111012",
  rejR1WB2: "41111111-1111-1111-1111-111111111013",
  cs1: "e1111111-1111-1111-1111-111111111101",
  cs2: "e1111111-1111-1111-1111-111111111102",
  cs3: "e1111111-1111-1111-1111-111111111103",
  cs4: "e1111111-1111-1111-1111-111111111104",
  cs5: "e1111111-1111-1111-1111-111111111105",
  cs6: "e1111111-1111-4111-8111-111111111106",
  catProd: "51111111-1111-1111-1111-111111111001",
  catWADown: "51111111-1111-1111-1111-111111111002",
  catWB1Down: "51111111-1111-1111-1111-111111111003",
  pRaw: "61111111-1111-1111-1111-111111111001",
  pWAPack: "61111111-1111-1111-1111-111111111002",
  pSponsor: "61111111-1111-1111-1111-111111111003",
  orderUp: "71111111-1111-1111-1111-111111111001",
  orderDown: "71111111-1111-1111-1111-111111111002",
  /** Instruction 16 — finance / encaissements demo receivables */
  orderFinOver: "71111111-1111-4111-8111-111111111010",
  orderFinCredit: "71111111-1111-4111-8111-111111111011",
  txnFinFail: "f1111111-1111-4111-8111-111111111099",
  neg1: "81111111-1111-1111-1111-111111111001",
  thProd: "91111111-1111-1111-1111-111111111001",
  /** Instruction 7 — multi-thread commerce messaging demos */
  negRejected: "81111111-1111-1111-1111-111111111002",
  negCartConverted: "81111111-1111-1111-1111-111111111003",
  thDelivery: "91111111-1111-1111-1111-111111111002",
  thRejected: "91111111-1111-1111-1111-111111111003",
  thCartConverted: "91111111-1111-1111-1111-111111111004",
  thPayment: "91111111-1111-1111-1111-111111111005",
  orderCart: "71111111-1111-1111-1111-111111111003",
  oiCart: "c1111111-1111-1111-1111-111111111003",
  wProd: "a1111111-1111-1111-1111-111111111001",
  wWA: "a1111111-1111-1111-1111-111111111002",
  wWB1: "a1111111-1111-1111-1111-111111111003",
  ecoRaw: "1c111111-1111-1111-1111-111111111001",
  ecoPack: "1c111111-1111-1111-1111-111111111002",
  ecoSponsor: "1c111111-1111-1111-1111-111111111003",
  trRaw: "1d111111-1111-1111-1111-111111111001",
  trPack: "1d111111-1111-1111-1111-111111111002",
  trSponsor: "1d111111-1111-1111-1111-111111111003",
  gb1: "1e111111-1111-1111-1111-111111111001",
  riConv: "b2111111-1111-4111-8111-111111111001",
  inj1: "1f111111-1111-1111-1111-111111111001",
  sCamp1: "f5111111-1111-4111-8111-111111111001",
  recall1: "1f111111-1111-1111-1111-111111111002",
} as const;

async function main() {
  // --- Users (phone-primary identity) ---
  const users = [
    {
      id: I.uProd,
      phoneNumber: "+221700000001",
      phoneVerified: true,
      fullName: "Aminata Diop",
      preferredLanguage: PreferredLanguage.fr,
      status: UserStatus.ACTIVE,
    },
    {
      id: I.uWA,
      phoneNumber: "+221700000002",
      phoneVerified: true,
      fullName: "Ibrahim Ndiaye",
      preferredLanguage: PreferredLanguage.fr,
      status: UserStatus.ACTIVE,
    },
    {
      id: I.uWB1,
      phoneNumber: "+221700000003",
      phoneVerified: true,
      fullName: "Khadija Sy",
      preferredLanguage: PreferredLanguage.fr,
      status: UserStatus.ACTIVE,
    },
    {
      id: I.uWB2,
      phoneNumber: "+221700000004",
      phoneVerified: true,
      fullName: "Moussa Fall",
      preferredLanguage: PreferredLanguage.fr,
      status: UserStatus.ACTIVE,
    },
    {
      id: I.uR1,
      phoneNumber: "+221700000201",
      phoneVerified: true,
      fullName: "Fatou Sarr",
      preferredLanguage: PreferredLanguage.en,
      status: UserStatus.ACTIVE,
    },
    {
      id: I.uR2,
      phoneNumber: "+221700000202",
      phoneVerified: true,
      fullName: "Omar Kane",
      preferredLanguage: PreferredLanguage.fr,
      status: UserStatus.ACTIVE,
    },
    {
      id: I.uR3,
      phoneNumber: "+221700000203",
      phoneVerified: true,
      fullName: "Aïcha Ba",
      preferredLanguage: PreferredLanguage.ar,
      status: UserStatus.ACTIVE,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: u,
      update: u,
    });
  }

  const orgs = [
    {
      id: I.oProd,
      commercialId: "4829173056",
      ownerUserId: I.uProd,
      displayName: "Sénégal Agro Industriel",
      legalName: "SAI SARL",
      activityLabel: "Transformation & conditionnement",
      actorType: OrganizationActorType.INDUSTRIAL_PRODUCER,
      category: OrganizationCategory.PRODUCER,
      country: "SN",
      city: "Dakar",
      commune: "Plateau",
      verificationStatus: OrganizationVerificationStatus.VERIFIED,
      credibilityScore: 0.91,
    },
    {
      id: I.oWA,
      commercialId: "5829173046",
      ownerUserId: I.uWA,
      displayName: "Grande Mauritanie Wholesale",
      legalName: "GMW SA",
      activityLabel: "Distribution nationale",
      actorType: OrganizationActorType.WHOLESALER,
      category: OrganizationCategory.WHOLESALER_A,
      country: "SN",
      city: "Thiès",
      verificationStatus: OrganizationVerificationStatus.VERIFIED,
      credibilityScore: 0.84,
    },
    {
      id: I.oWB1,
      commercialId: "6829173045",
      ownerUserId: I.uWB1,
      displayName: "Delta Grossiste B — Nord",
      legalName: "Delta Nord SARL",
      activityLabel: "Grossiste régional",
      actorType: OrganizationActorType.WHOLESALER,
      category: OrganizationCategory.WHOLESALER_B,
      country: "SN",
      city: "Saint-Louis",
      verificationStatus: OrganizationVerificationStatus.VERIFIED,
      credibilityScore: 0.72,
    },
    {
      id: I.oWB2,
      commercialId: "7829173044",
      ownerUserId: I.uWB2,
      displayName: "Delta Grossiste B — Sud",
      legalName: "Delta Sud SARL",
      activityLabel: "Grossiste régional",
      actorType: OrganizationActorType.WHOLESALER,
      category: OrganizationCategory.WHOLESALER_B,
      country: "SN",
      city: "Ziguinchor",
      verificationStatus: OrganizationVerificationStatus.VERIFIED,
      credibilityScore: 0.7,
    },
    {
      id: I.oR1,
      commercialId: "8829173043",
      ownerUserId: I.uR1,
      displayName: "Épicerie Plateau 12",
      activityLabel: "Commerce de proximité",
      actorType: OrganizationActorType.RETAILER,
      category: OrganizationCategory.RETAILER,
      country: "SN",
      city: "Dakar",
      verificationStatus: OrganizationVerificationStatus.PENDING,
      credibilityScore: 0.55,
    },
    {
      id: I.oR2,
      commercialId: "9829173042",
      ownerUserId: I.uR2,
      displayName: "Mini marché Liberté",
      activityLabel: "Point de vente",
      actorType: OrganizationActorType.RETAILER,
      category: OrganizationCategory.RETAILER,
      country: "SN",
      city: "Thiès",
      verificationStatus: OrganizationVerificationStatus.PENDING,
      credibilityScore: 0.52,
    },
    {
      id: I.oR3,
      commercialId: "1827364950",
      ownerUserId: I.uR3,
      displayName: "Marché Sandaga Express",
      activityLabel: "Commerce",
      actorType: OrganizationActorType.RETAILER,
      category: OrganizationCategory.RETAILER,
      country: "SN",
      city: "Dakar",
      verificationStatus: OrganizationVerificationStatus.PENDING,
      credibilityScore: 0.48,
    },
  ];

  for (const o of orgs) {
    await prisma.organization.upsert({
      where: { id: o.id },
      create: o,
      update: o,
    });
  }

  await prisma.organization.update({
    where: { id: I.oProd },
    data: { commercialBadges: ["INDUSTRIAL_PARTNER", "CERTIFIED", "PREMIUM"] },
  });
  await prisma.organization.update({
    where: { id: I.oWA },
    data: { commercialBadges: ["VERIFIED"] },
  });
  await prisma.organization.update({
    where: { id: I.oWB1 },
    data: { commercialBadges: ["VERIFIED", "PREMIUM"] },
  });

  await prisma.userContactSnapshot.upsert({
    where: {
      userId_normalizedPhone: { userId: I.uWB1, normalizedPhone: "+221700000900" },
    },
    create: { id: I.ucsWB1, userId: I.uWB1, normalizedPhone: "+221700000900" },
    update: {},
  });
  await prisma.userContactSnapshot.upsert({
    where: {
      userId_normalizedPhone: { userId: I.uR3, normalizedPhone: "+221700000900" },
    },
    create: { id: I.ucsR3, userId: I.uR3, normalizedPhone: "+221700000900" },
    update: {},
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId: I.oProd, userId: I.uProd },
    },
    create: {
      organizationId: I.oProd,
      userId: I.uProd,
      role: OrgMemberRole.OWNER,
      status: OrgMemberStatus.ACTIVE,
    },
    update: {},
  });
  const pairs = [
    [I.oWA, I.uWA],
    [I.oWB1, I.uWB1],
    [I.oWB2, I.uWB2],
    [I.oR1, I.uR1],
    [I.oR2, I.uR2],
    [I.oR3, I.uR3],
  ] as const;
  for (const [org, user] of pairs) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org, userId: user } },
      create: {
        organizationId: org,
        userId: user,
        role: OrgMemberRole.OWNER,
        status: OrgMemberStatus.ACTIVE,
      },
      update: {},
    });
  }

  const rels = [
    {
      id: I.rProdWA,
      requesterOrganizationId: I.oWA,
      receiverOrganizationId: I.oProd,
      source: RelationshipSource.MANUAL_INVITATION,
      upstreamOrganizationId: I.oProd,
      downstreamOrganizationId: I.oWA,
      status: RelationshipStatus.ACCEPTED,
      acceptedAt: new Date(),
      trustLevel: 0.88,
      commerceCategory: "PRODUCER->WHOLESALER_A",
      visibilityPermissions: {},
    },
    {
      id: I.rProdWB1,
      requesterOrganizationId: I.oWB1,
      receiverOrganizationId: I.oProd,
      source: RelationshipSource.NETWORK_CODE,
      upstreamOrganizationId: I.oProd,
      downstreamOrganizationId: I.oWB1,
      status: RelationshipStatus.ACCEPTED,
      acceptedAt: new Date(),
      trustLevel: 0.81,
      commerceCategory: "PRODUCER->WHOLESALER_B",
      visibilityPermissions: {},
    },
    {
      id: I.rWAR1,
      requesterOrganizationId: I.oR1,
      receiverOrganizationId: I.oWA,
      source: RelationshipSource.PHONE_CONTACT,
      upstreamOrganizationId: I.oWA,
      downstreamOrganizationId: I.oR1,
      status: RelationshipStatus.ACCEPTED,
      acceptedAt: new Date(),
      trustLevel: 0.74,
      commerceCategory: "WHOLESALER_A->RETAILER",
      visibilityPermissions: {},
    },
    {
      id: I.rWB1R2,
      requesterOrganizationId: I.oR2,
      receiverOrganizationId: I.oWB1,
      source: RelationshipSource.PHONE_CONTACT,
      upstreamOrganizationId: I.oWB1,
      downstreamOrganizationId: I.oR2,
      status: RelationshipStatus.ACCEPTED,
      acceptedAt: new Date(),
      trustLevel: 0.7,
      commerceCategory: "WHOLESALER_B->RETAILER",
      visibilityPermissions: {},
    },
    {
      id: I.rWAR3,
      requesterOrganizationId: I.oR3,
      receiverOrganizationId: I.oWA,
      source: RelationshipSource.NETWORK_CODE,
      upstreamOrganizationId: I.oWA,
      downstreamOrganizationId: I.oR3,
      status: RelationshipStatus.ACCEPTED,
      acceptedAt: new Date(),
      trustLevel: 0.68,
      commerceCategory: "WHOLESALER_A->RETAILER",
      visibilityPermissions: {},
    },
    {
      id: I.rWAWB1,
      requesterOrganizationId: I.oWB1,
      receiverOrganizationId: I.oWA,
      source: RelationshipSource.MANUAL_INVITATION,
      upstreamOrganizationId: I.oWA,
      downstreamOrganizationId: I.oWB1,
      status: RelationshipStatus.ACCEPTED,
      acceptedAt: new Date(),
      trustLevel: 0.76,
      commerceCategory: "WHOLESALER_A->WHOLESALER_B",
      visibilityPermissions: {},
    },
  ];
  for (const r of rels) {
    await prisma.relationship.upsert({
      where: { id: r.id },
      create: r,
      update: r,
    });
  }

  await prisma.relationship.upsert({
    where: { id: I.relSusp },
    create: {
      id: I.relSusp,
      requesterOrganizationId: I.oWB2,
      receiverOrganizationId: I.oR3,
      source: RelationshipSource.MANUAL_INVITATION,
      status: RelationshipStatus.SUSPENDED,
      upstreamOrganizationId: I.oWB2,
      downstreamOrganizationId: I.oR3,
      trustLevel: 0.2,
      commerceCategory: "WHOLESALER_B->RETAILER",
      visibilityPermissions: { suspendedReason: "risk_review_demo" },
    },
    update: {
      status: RelationshipStatus.SUSPENDED,
      trustLevel: 0.2,
      visibilityPermissions: { suspendedReason: "risk_review_demo" },
    },
  });

  await prisma.relationship.upsert({
    where: { id: I.relBlockedWA_WB2 },
    create: {
      id: I.relBlockedWA_WB2,
      requesterOrganizationId: I.oWB2,
      receiverOrganizationId: I.oWA,
      source: RelationshipSource.MANUAL_INVITATION,
      status: RelationshipStatus.BLOCKED,
      upstreamOrganizationId: I.oWA,
      downstreamOrganizationId: I.oWB2,
      trustLevel: 0.12,
      commerceCategory: "WHOLESALER_A->WHOLESALER_B",
      visibilityPermissions: {
        sourceMethod: "MANUAL_INVITATION",
        blockedReason: "instruction_9a_demo_blocked_edge",
      },
    },
    update: {
      status: RelationshipStatus.BLOCKED,
      trustLevel: 0.12,
      visibilityPermissions: {
        sourceMethod: "MANUAL_INVITATION",
        blockedReason: "instruction_9a_demo_blocked_edge",
      },
    },
  });

  const instruction4Rels = [
    {
      id: I.pendR3WB2,
      requesterOrganizationId: I.oR3,
      receiverOrganizationId: I.oWB2,
      source: RelationshipSource.MANUAL_INVITATION,
      status: RelationshipStatus.PENDING,
    },
    {
      id: I.pendWB2WA,
      requesterOrganizationId: I.oWB2,
      receiverOrganizationId: I.oWA,
      source: RelationshipSource.MANUAL_INVITATION,
      status: RelationshipStatus.PENDING,
    },
    {
      id: I.pendWAWB1,
      requesterOrganizationId: I.oR2,
      receiverOrganizationId: I.oProd,
      source: RelationshipSource.PHONE_CONTACT,
      upstreamOrganizationId: I.oProd,
      downstreamOrganizationId: I.oR2,
      status: RelationshipStatus.PENDING,
    },
    {
      id: I.rejR1WB2,
      requesterOrganizationId: I.oR1,
      receiverOrganizationId: I.oWB2,
      source: RelationshipSource.MANUAL_INVITATION,
      status: RelationshipStatus.REJECTED,
      rejectedAt: new Date(),
    },
  ] as const;
  for (const r of instruction4Rels) {
    await prisma.relationship.upsert({
      where: { id: r.id },
      create: r,
      update: r,
    });
  }

  const contactSuggestionRows = [
    {
      id: I.cs1,
      userId: I.uR1,
      suggestedOrganizationId: I.oWA,
      reason: ContactSuggestionReason.mutual_phone_contact,
      score: 75,
      source: ContactSuggestionSource.CONTACT_SYNC,
      status: ContactSuggestionStatus.OPEN,
    },
    {
      id: I.cs2,
      userId: I.uR1,
      suggestedOrganizationId: I.oWB1,
      reason: ContactSuggestionReason.same_commercial_zone,
      score: 68,
      source: ContactSuggestionSource.CONTACT_SYNC,
      status: ContactSuggestionStatus.OPEN,
    },
    {
      id: I.cs3,
      userId: I.uR1,
      suggestedOrganizationId: I.oProd,
      reason: ContactSuggestionReason.network_code,
      score: 62,
      source: ContactSuggestionSource.GRAPH_INFERENCE,
      status: ContactSuggestionStatus.OPEN,
    },
    {
      id: I.cs4,
      userId: I.uR1,
      suggestedOrganizationId: I.oWB2,
      reason: ContactSuggestionReason.mutual_phone_contact,
      score: 88,
      source: ContactSuggestionSource.CONTACT_SYNC,
      status: ContactSuggestionStatus.OPEN,
    },
    {
      id: I.cs5,
      userId: I.uR1,
      suggestedOrganizationId: I.oR2,
      reason: ContactSuggestionReason.repeated_transaction_signal,
      score: 55,
      source: ContactSuggestionSource.GRAPH_INFERENCE,
      status: ContactSuggestionStatus.OPEN,
    },
    {
      id: I.cs6,
      userId: I.uWB1,
      suggestedOrganizationId: I.oR3,
      reason: ContactSuggestionReason.mutual_phone_contact,
      score: 92,
      source: ContactSuggestionSource.CONTACT_SYNC,
      status: ContactSuggestionStatus.OPEN,
    },
  ] as const;
  for (const c of contactSuggestionRows) {
    await prisma.contactSuggestion.upsert({
      where: { id: c.id },
      create: c,
      update: c,
    });
  }

  await prisma.networkCode.upsert({
    where: { code: "VENEXT-GROSS-9F3A" },
    create: {
      organizationId: I.oWA,
      code: "VENEXT-GROSS-9F3A",
      active: true,
      usageLimit: 500,
      usageCount: 12,
    },
    update: { usageCount: 12 },
  });

  await prisma.networkCode.upsert({
    where: { code: "VX-WB1-NORD-DEMO" },
    create: {
      organizationId: I.oWB1,
      code: "VX-WB1-NORD-DEMO",
      active: true,
      usageLimit: 200,
      usageCount: 7,
    },
    update: { usageCount: 7 },
  });

  await prisma.catalog.upsert({
    where: { id: I.catProd },
    create: {
      id: I.catProd,
      organizationId: I.oProd,
      name: "Catalogue producteur — lots industriels",
      catalogType: CatalogType.DOWNSTREAM_OWN_CATALOG,
      visibilityMode: CatalogVisibilityMode.RELATIONSHIP_ONLY,
      active: true,
    },
    update: {},
  });
  await prisma.catalog.upsert({
    where: { id: I.catWADown },
    create: {
      id: I.catWADown,
      organizationId: I.oWA,
      name: "Assortiment grossiste A — réseau validé",
      catalogType: CatalogType.DOWNSTREAM_OWN_CATALOG,
      visibilityMode: CatalogVisibilityMode.RELATIONSHIP_ONLY,
      active: true,
    },
    update: {},
  });
  await prisma.catalog.upsert({
    where: { id: I.catWB1Down },
    create: {
      id: I.catWB1Down,
      organizationId: I.oWB1,
      name: "Assortiment grossiste B — Nord",
      catalogType: CatalogType.DOWNSTREAM_OWN_CATALOG,
      visibilityMode: CatalogVisibilityMode.SPONSORED_ALLOWED,
      active: true,
    },
    update: {},
  });

  await prisma.product.upsert({
    where: { id: I.pRaw },
    create: {
      id: I.pRaw,
      organizationId: I.oProd,
      catalogId: I.catProd,
      name: "Huile végétale industrielle — palétisée",
      description: "Lot calibré pour réseau grossiste agréé.",
      category: "huiles",
      unitLabel: "palette",
      basePrice: d(420000),
      currency: "XOF",
      stockStatus: StockStatus.AVAILABLE,
      stockQuantity: d(120),
      paymentModes: [PaymentMode.ELECTRONIC_OPTIONAL, PaymentMode.CASH],
      qualityBadges: [QualityBadge.verified_supplier, QualityBadge.traceability_ready],
      sponsorEligible: false,
      active: true,
    },
    update: {},
  });

  await prisma.product.upsert({
    where: { id: I.pWAPack },
    create: {
      id: I.pWAPack,
      organizationId: I.oWA,
      catalogId: I.catWADown,
      name: "Huile 5L — réseau détaillants",
      description: "Conditionnement pour commerce de proximité.",
      category: "huiles",
      unitLabel: "carton",
      basePrice: d(18500),
      currency: "XOF",
      stockStatus: StockStatus.LOW_STOCK,
      stockQuantity: d(400),
      paymentModes: [PaymentMode.PAY_ON_DELIVERY, PaymentMode.CASH],
      qualityBadges: [QualityBadge.premium_badge],
      sponsorEligible: false,
      active: true,
    },
    update: {},
  });

  await prisma.product.upsert({
    where: { id: I.pSponsor },
    create: {
      id: I.pSponsor,
      organizationId: I.oWB1,
      catalogId: I.catWB1Down,
      name: "Pack promo sponsorisé — boisson locale",
      description: "Visibilité renforcée dans le réseau partenaire.",
      category: "boissons",
      unitLabel: "caisse",
      basePrice: d(22000),
      currency: "XOF",
      stockStatus: StockStatus.AVAILABLE,
      stockQuantity: d(800),
      paymentModes: [PaymentMode.ELECTRONIC_REQUIRED],
      qualityBadges: [QualityBadge.certified_product],
      sponsorEligible: true,
      active: true,
    },
    update: {},
  });

  const visRows = [
    {
      productId: I.pRaw,
      visibleToRelationshipId: I.rProdWA,
      visibilityType: ProductVisibilityType.RELATIONSHIP_DEFAULT,
    },
    {
      productId: I.pRaw,
      visibleToRelationshipId: I.rProdWB1,
      visibilityType: ProductVisibilityType.RELATIONSHIP_DEFAULT,
    },
    {
      productId: I.pWAPack,
      visibleToRelationshipId: I.rWAR1,
      visibilityType: ProductVisibilityType.RELATIONSHIP_DEFAULT,
    },
    {
      productId: I.pWAPack,
      visibleToRelationshipId: I.rWAR3,
      visibilityType: ProductVisibilityType.RELATIONSHIP_DEFAULT,
    },
    {
      productId: I.pSponsor,
      visibleToRelationshipId: I.rWB1R2,
      visibilityType: ProductVisibilityType.SPONSORED_INJECTION,
    },
  ];

  const visIds = [
    "b1111111-1111-1111-1111-111111111101",
    "b1111111-1111-1111-1111-111111111102",
    "b1111111-1111-1111-1111-111111111103",
    "b1111111-1111-1111-1111-111111111104",
    "b1111111-1111-1111-1111-111111111105",
  ];
  for (let i = 0; i < visRows.length; i++) {
    const row = visRows[i]!;
    const id = visIds[i]!;
    await prisma.productVisibility.upsert({
      where: { id },
      create: { id, ...row, active: true },
      update: row,
    });
  }

  await prisma.order.upsert({
    where: { id: I.orderUp },
    create: {
      id: I.orderUp,
      buyerOrganizationId: I.oWA,
      sellerOrganizationId: I.oProd,
      relationshipId: I.rProdWA,
      status: OrderStatus.ACCEPTED,
      orderDirection: OrderDirection.UPSTREAM_PURCHASE,
      totalAmount: d(8400000),
      currency: "XOF",
      paymentStatus: PaymentStatus.PARTIALLY_PAID,
      deliveryStatus: DeliveryStatus.PREPARING,
    },
    update: {},
  });

  await prisma.orderItem.upsert({
    where: { id: "c1111111-1111-1111-1111-111111111001" },
    create: {
      id: "c1111111-1111-1111-1111-111111111001",
      orderId: I.orderUp,
      productId: I.pRaw,
      quantity: d(20),
      unitPrice: d(420000),
      subtotal: d(8400000),
    },
    update: {},
  });

  await prisma.order.upsert({
    where: { id: I.orderDown },
    create: {
      id: I.orderDown,
      buyerOrganizationId: I.oR1,
      sellerOrganizationId: I.oWA,
      relationshipId: I.rWAR1,
      status: OrderStatus.SUBMITTED,
      orderDirection: OrderDirection.DOWNSTREAM_CLIENT_ORDER,
      totalAmount: d(185000),
      currency: "XOF",
      paymentStatus: PaymentStatus.PAY_ON_DELIVERY,
      deliveryStatus: DeliveryStatus.NOT_STARTED,
    },
    update: {},
  });

  await prisma.orderItem.upsert({
    where: { id: "c1111111-1111-1111-1111-111111111002" },
    create: {
      id: "c1111111-1111-1111-1111-111111111002",
      orderId: I.orderDown,
      productId: I.pWAPack,
      quantity: d(10),
      unitPrice: d(18500),
      subtotal: d(185000),
    },
    update: {},
  });

  const finOverCreated = new Date(Date.now() - 42 * 86400000);
  await prisma.order.upsert({
    where: { id: I.orderFinOver },
    create: {
      id: I.orderFinOver,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
      relationshipId: I.rProdWB1,
      status: OrderStatus.ACCEPTED,
      orderDirection: OrderDirection.DOWNSTREAM_CLIENT_ORDER,
      totalAmount: d(3_200_000),
      currency: "XOF",
      paymentStatus: PaymentStatus.UNPAID,
      deliveryStatus: DeliveryStatus.PREPARING,
      createdAt: finOverCreated,
    },
    update: { paymentStatus: PaymentStatus.UNPAID, createdAt: finOverCreated },
  });
  await prisma.orderItem.upsert({
    where: { id: "c1111111-1111-4111-8111-111111111010" },
    create: {
      id: "c1111111-1111-4111-8111-111111111010",
      orderId: I.orderFinOver,
      productId: I.pRaw,
      quantity: d(8),
      unitPrice: d(400000),
      subtotal: d(3200000),
    },
    update: {},
  });

  await prisma.order.upsert({
    where: { id: I.orderFinCredit },
    create: {
      id: I.orderFinCredit,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
      relationshipId: I.rProdWB1,
      status: OrderStatus.ACCEPTED,
      orderDirection: OrderDirection.DOWNSTREAM_CLIENT_ORDER,
      totalAmount: d(5_400_000),
      currency: "XOF",
      paymentStatus: PaymentStatus.CREDIT,
      deliveryStatus: DeliveryStatus.NOT_STARTED,
    },
    update: {},
  });
  await prisma.orderItem.upsert({
    where: { id: "c1111111-1111-4111-8111-111111111011" },
    create: {
      id: "c1111111-1111-4111-8111-111111111011",
      orderId: I.orderFinCredit,
      productId: I.pRaw,
      quantity: d(12),
      unitPrice: d(450000),
      subtotal: d(5400000),
    },
    update: {},
  });

  await prisma.transaction.upsert({
    where: { id: I.txnFinFail },
    create: {
      id: I.txnFinFail,
      walletId: I.wWB1,
      organizationId: I.oWB1,
      type: TransactionType.PAYMENT,
      amount: d(950000),
      currency: "XOF",
      status: TransactionStatus.FAILED,
      provider: "MOCK_PROVIDER",
      reference: "FIN16_DEMO_FAIL",
    },
    update: { status: TransactionStatus.FAILED },
  });

  await prisma.negotiation.upsert({
    where: { id: I.neg1 },
    create: {
      id: I.neg1,
      productId: I.pRaw,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
      status: NegotiationStatus.PROPOSED,
      proposedQuantity: d(15),
      proposedPrice: d(410000),
      proposedPaymentMode: PaymentMode.ELECTRONIC_OPTIONAL,
      paymentConstraints: { electronicProofRequired: true, maxCreditDays: 14 },
      expiresAt: new Date(Date.now() + 86400000 * 3),
    },
    update: {
      proposedPaymentMode: PaymentMode.ELECTRONIC_OPTIONAL,
      paymentConstraints: { electronicProofRequired: true, maxCreditDays: 14 },
    },
  });

  await prisma.messageThread.upsert({
    where: { id: I.thProd },
    create: {
      id: I.thProd,
      threadType: ThreadType.NEGOTIATION_CONTEXT,
      productId: I.pRaw,
      negotiationId: I.neg1,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
    },
    update: {
      threadType: ThreadType.NEGOTIATION_CONTEXT,
      negotiationId: I.neg1,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
    },
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-1111-1111-111111111001" },
    create: {
      id: "d1111111-1111-1111-1111-111111111001",
      threadId: I.thProd,
      senderUserId: I.uWB1,
      senderOrganizationId: I.oWB1,
      messageType: MessageType.TEXT,
      content:
        "Besoin de confirmer lot + fenêtre logistique pour Thiès — toujours sur ce SKU ?",
    },
    update: { threadId: I.thProd, senderUserId: I.uWB1, senderOrganizationId: I.oWB1 },
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-1111-1111-111111111002" },
    create: {
      id: "d1111111-1111-1111-1111-111111111002",
      threadId: I.thProd,
      senderUserId: I.uWB1,
      senderOrganizationId: I.oWB1,
      messageType: MessageType.PRICE_PROPOSAL,
      content: "Contre-proposition volume Saint-Louis.",
      structuredEvent: {
        kind: "price_proposal",
        proposedUnitPrice: 410000,
        currency: "XOF",
      },
    },
    update: { threadId: I.thProd },
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-1111-1111-111111111003" },
    create: {
      id: "d1111111-1111-1111-1111-111111111003",
      threadId: I.thProd,
      senderUserId: I.uProd,
      senderOrganizationId: I.oProd,
      messageType: MessageType.VOICE,
      voiceUrl: "https://cdn.venext.local/demo/voice-placeholder.opus",
      content: null,
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111011" },
    create: {
      id: "d1111111-1111-4111-8111-111111111011",
      threadId: I.thProd,
      senderUserId: I.uWB1,
      senderOrganizationId: I.oWB1,
      messageType: MessageType.QUANTITY_PROPOSAL,
      content: "Renfort 18 tonnes — alignement capacité dock Thiès.",
      structuredEvent: { kind: "quantity_proposal", quantity: 18 },
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111012" },
    create: {
      id: "d1111111-1111-4111-8111-111111111012",
      threadId: I.thProd,
      senderUserId: I.uProd,
      senderOrganizationId: I.oProd,
      messageType: MessageType.DELIVERY_PROPOSAL,
      content: "Départ entrepôt Dakar-Plateau · fenêtre J+2 si paiement avant 14h.",
      structuredEvent: { kind: "delivery_proposal", hub: "DKR-PLATEAU", windowHours: 48 },
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111013" },
    create: {
      id: "d1111111-1111-4111-8111-111111111013",
      threadId: I.thProd,
      senderUserId: I.uProd,
      senderOrganizationId: I.oProd,
      messageType: MessageType.PAYMENT_PROPOSAL,
      content: "Wave / Orange Money — preuve requise avant chargement palette.",
      structuredEvent: { kind: "payment_proposal", mode: "MOBILE_MONEY" },
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111014" },
    create: {
      id: "d1111111-1111-4111-8111-111111111014",
      threadId: I.thProd,
      senderUserId: I.uWB1,
      senderOrganizationId: I.oWB1,
      messageType: MessageType.IMAGE,
      content: "Preuve de paiement (mock)",
      mediaUrls: ["https://cdn.venext.local/demo/payment-proof-thumb.webp"],
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111015" },
    create: {
      id: "d1111111-1111-4111-8111-111111111015",
      threadId: I.thProd,
      senderUserId: I.uProd,
      senderOrganizationId: I.oProd,
      messageType: MessageType.SYSTEM_EVENT,
      content: "Synchronisation stock ERP — lot réservable sous 48h.",
      structuredEvent: { kind: "stock_sync", tension: "MEDIUM" },
    },
    update: {},
  });

  await prisma.pendingOutboundMessage.upsert({
    where: { id: "f0e11111-e111-4111-8111-111111111001" },
    create: {
      id: "f0e11111-e111-4111-8111-111111111001",
      threadId: I.thProd,
      payload: {
        op: "send_text",
        draft: "Relance horaire livraison — file hors-ligne (Instruction 7 §10).",
      },
    },
    update: {},
  });

  await prisma.negotiation.upsert({
    where: { id: I.negRejected },
    create: {
      id: I.negRejected,
      productId: I.pSponsor,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
      status: NegotiationStatus.REJECTED,
      proposedQuantity: d(8),
      proposedPrice: d(195000),
    },
    update: {},
  });

  await prisma.messageThread.upsert({
    where: { id: I.thRejected },
    create: {
      id: I.thRejected,
      threadType: ThreadType.NEGOTIATION_CONTEXT,
      productId: I.pSponsor,
      negotiationId: I.negRejected,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
    },
    update: {
      threadType: ThreadType.NEGOTIATION_CONTEXT,
      negotiationId: I.negRejected,
    },
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111021" },
    create: {
      id: "d1111111-1111-4111-8111-111111111021",
      threadId: I.thRejected,
      senderUserId: I.uWB1,
      senderOrganizationId: I.oWB1,
      messageType: MessageType.PRICE_PROPOSAL,
      content: "Test sponsoring — palier volume agressif.",
      structuredEvent: { kind: "price_proposal", proposedUnitPrice: 175000, currency: "XOF" },
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111022" },
    create: {
      id: "d1111111-1111-4111-8111-111111111022",
      threadId: I.thRejected,
      senderUserId: I.uProd,
      senderOrganizationId: I.oProd,
      messageType: MessageType.VOICE,
      voiceUrl: "https://cdn.venext.local/demo/voice-counter.opus",
      content: null,
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111023" },
    create: {
      id: "d1111111-1111-4111-8111-111111111023",
      threadId: I.thRejected,
      senderUserId: I.uProd,
      senderOrganizationId: I.oProd,
      messageType: MessageType.REJECTION_EVENT,
      content: "Marge insuffisante sur ce palier — cloture négociation.",
      structuredEvent: { kind: "rejection", reason: "margin_floor" },
    },
    update: {},
  });

  await prisma.negotiation.upsert({
    where: { id: I.negCartConverted },
    create: {
      id: I.negCartConverted,
      productId: I.pSponsor,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
      status: NegotiationStatus.CONVERTED_TO_CART,
      proposedQuantity: d(12),
      proposedPrice: d(188000),
      acceptedQuantity: d(12),
      acceptedPrice: d(188000),
    },
    update: {},
  });

  await prisma.order.upsert({
    where: { id: I.orderCart },
    create: {
      id: I.orderCart,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
      relationshipId: I.rProdWB1,
      status: OrderStatus.DRAFT,
      orderDirection: OrderDirection.UPSTREAM_PURCHASE,
      totalAmount: d(2256000),
      currency: "XOF",
      paymentStatus: PaymentStatus.UNPAID,
      deliveryStatus: DeliveryStatus.NOT_STARTED,
    },
    update: {},
  });

  await prisma.orderItem.upsert({
    where: { id: I.oiCart },
    create: {
      id: I.oiCart,
      orderId: I.orderCart,
      productId: I.pSponsor,
      quantity: d(12),
      unitPrice: d(188000),
      negotiatedPrice: d(188000),
      subtotal: d(2256000),
    },
    update: {},
  });

  await prisma.messageThread.upsert({
    where: { id: I.thCartConverted },
    create: {
      id: I.thCartConverted,
      threadType: ThreadType.NEGOTIATION_CONTEXT,
      productId: I.pSponsor,
      negotiationId: I.negCartConverted,
      buyerOrganizationId: I.oWB1,
      sellerOrganizationId: I.oProd,
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111031" },
    create: {
      id: "d1111111-1111-4111-8111-111111111031",
      threadId: I.thCartConverted,
      senderUserId: I.uWB1,
      senderOrganizationId: I.oWB1,
      messageType: MessageType.ACCEPTANCE_EVENT,
      content: "Négociation acceptée — termes figés pour passage panier.",
      structuredEvent: { kind: "acceptance", quantity: "12", unitPrice: "188000" },
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111032" },
    create: {
      id: "d1111111-1111-4111-8111-111111111032",
      threadId: I.thCartConverted,
      senderUserId: I.uWB1,
      senderOrganizationId: I.oWB1,
      messageType: MessageType.CART_CONVERSION_EVENT,
      content: "Produit basculé en commande brouillon — en attente confirmation paiement.",
      structuredEvent: { kind: "cart_conversion", orderId: I.orderCart, negotiationId: I.negCartConverted },
    },
    update: {},
  });

  await prisma.messageThread.upsert({
    where: { id: I.thDelivery },
    create: {
      id: I.thDelivery,
      threadType: ThreadType.DELIVERY_CONTEXT,
      orderId: I.orderUp,
      productId: I.pRaw,
      buyerOrganizationId: I.oWA,
      sellerOrganizationId: I.oProd,
    },
    update: {
      threadType: ThreadType.DELIVERY_CONTEXT,
      orderId: I.orderUp,
    },
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111041" },
    create: {
      id: "d1111111-1111-4111-8111-111111111041",
      threadId: I.thDelivery,
      senderUserId: I.uProd,
      senderOrganizationId: I.oProd,
      messageType: MessageType.SYSTEM_EVENT,
      content: "Camion groupé SN-DKR-01 — ETA recalculée (conditions réseau).",
      structuredEvent: { kind: "eta_update", etaHours: 26, corridor: "SN-DKR-01" },
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111042" },
    create: {
      id: "d1111111-1111-4111-8111-111111111042",
      threadId: I.thDelivery,
      senderUserId: I.uWA,
      senderOrganizationId: I.oWA,
      messageType: MessageType.DELIVERY_PROPOSAL,
      content: "Point de chute Kaolack possible si retard < 4h.",
      structuredEvent: { kind: "delivery_proposal", waypoint: "Kaolack" },
    },
    update: {},
  });

  await prisma.messageThread.upsert({
    where: { id: I.thPayment },
    create: {
      id: I.thPayment,
      threadType: ThreadType.PAYMENT_CONTEXT,
      orderId: I.orderDown,
      productId: I.pWAPack,
      buyerOrganizationId: I.oR1,
      sellerOrganizationId: I.oWA,
    },
    update: {
      threadType: ThreadType.PAYMENT_CONTEXT,
      orderId: I.orderDown,
    },
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111051" },
    create: {
      id: "d1111111-1111-4111-8111-111111111051",
      threadId: I.thPayment,
      senderUserId: I.uR1,
      senderOrganizationId: I.oR1,
      messageType: MessageType.IMAGE,
      content: "Preuve paiement espèces / mobile (mock)",
      mediaUrls: ["https://cdn.venext.local/demo/cash-proof-thumb.webp"],
    },
    update: {},
  });

  await prisma.message.upsert({
    where: { id: "d1111111-1111-4111-8111-111111111052" },
    create: {
      id: "d1111111-1111-4111-8111-111111111052",
      threadId: I.thPayment,
      senderUserId: I.uWA,
      senderOrganizationId: I.oWA,
      messageType: MessageType.SYSTEM_EVENT,
      content: "Vérification paiement — alignement wallet relationnel en cours.",
      structuredEvent: { kind: "payment_verification", state: "PENDING" },
    },
    update: {},
  });

  await prisma.reservationIntent.upsert({
    where: { id: I.riConv },
    create: {
      id: I.riConv,
      organizationId: I.oProd,
      relationshipId: I.rProdWA,
      productId: I.pRaw,
      negotiationId: I.neg1,
      requestedQuantity: d(120),
      reservedQuantity: d(60),
      status: ReservationIntentStatus.RESERVED,
      source: ReservationIntentSource.CONVERSATION,
      expiresAt: new Date(Date.now() + 10 * 86400000),
      metadata: {},
    },
    update: {
      status: ReservationIntentStatus.RESERVED,
      reservedQuantity: d(60),
    },
  });

  const signals = [
    {
      signalType: EconomicSignalType.PRODUCT_VIEW,
      productId: I.pWAPack,
      organizationId: I.oR1,
      zoneCode: "SN-DKR-01",
      source: EconomicSignalSource.CATALOG,
      intensityScore: 0.42,
      metadata: { surface: "relational_catalog" },
    },
    {
      signalType: EconomicSignalType.ACTIVE_DISCUSSION,
      productId: I.pRaw,
      organizationId: I.oWA,
      zoneCode: "SN-DKR-01",
      source: EconomicSignalSource.MESSAGE,
      intensityScore: 0.77,
      metadata: {},
    },
    {
      signalType: EconomicSignalType.DEMAND_RISE,
      productId: I.pWAPack,
      organizationId: I.oWA,
      zoneCode: "SN-THIES",
      source: EconomicSignalSource.ORDER,
      intensityScore: 0.63,
      metadata: {},
    },
    {
      signalType: EconomicSignalType.STOCK_TENSION,
      productId: I.pWAPack,
      organizationId: I.oWA,
      zoneCode: "SN-DKR-01",
      source: EconomicSignalSource.CATALOG,
      intensityScore: 0.88,
      metadata: { note: "LOW_STOCK" },
    },
  ];
  const sigIds = [
    "e1111111-1111-1111-1111-111111111001",
    "e1111111-1111-1111-1111-111111111002",
    "e1111111-1111-1111-1111-111111111003",
    "e1111111-1111-1111-1111-111111111004",
  ];
  for (let i = 0; i < signals.length; i++) {
    await prisma.economicSignal.upsert({
      where: { id: sigIds[i]! },
      create: { id: sigIds[i]!, ...signals[i]! },
      update: signals[i]!,
    });
  }

  const flags: {
    key: string;
    description: string;
    enabled: boolean;
  }[] = [
    { key: "wallet_enabled", description: "Portefeuille intégré", enabled: true },
    { key: "payments_enabled", description: "Paiements", enabled: true },
    { key: "qr_enabled", description: "QR commerce", enabled: true },
    { key: "nfc_enabled", description: "NFC zones", enabled: false },
    { key: "transfer_enabled", description: "Virements wallet", enabled: true },
    { key: "electronic_payment_enabled", description: "Paiement électronique orchestré", enabled: true },
    { key: "provider_orange_enabled", description: "Provider Orange (stub)", enabled: false },
    { key: "provider_wave_enabled", description: "Provider Wave (stub)", enabled: true },
    { key: "provider_mtn_enabled", description: "Provider MTN (stub)", enabled: false },
    {
      key: "sponsored_products_enabled",
      description: "Injection sponsorisée contextuelle",
      enabled: true,
    },
    {
      key: "group_buying_enabled",
      description: "Group buying",
      enabled: false,
    },
    {
      key: "ai_assistant_enabled",
      description: "Assistants IA",
      enabled: true,
    },
    {
      key: "industrial_safety_enabled",
      description: "Sécurité industrielle",
      enabled: true,
    },
    {
      key: "industrial_poles_enabled",
      description: "Industrial pole cockpits (Instruction 5)",
      enabled: true,
    },
    {
      key: "logistics_map_enabled",
      description: "Operational logistics map layers",
      enabled: true,
    },
    {
      key: "realtime_signals_enabled",
      description: "Realtime economic signal gateway",
      enabled: true,
    },
    {
      key: "weather_signals_enabled",
      description: "Weather external signal connectors",
      enabled: true,
    },
    {
      key: "sponsored_visibility_enabled",
      description: "Sponsored visibility / activation overlays",
      enabled: true,
    },
    { key: "edge_sync_enabled", description: "Edge sync", enabled: true },
    {
      key: "voice_messaging_enabled",
      description: "Messages vocaux",
      enabled: true,
    },
    {
      key: "relationship_graph_enabled",
      description: "Graphe relationnel commerce fermé",
      enabled: true,
    },
    { key: "contact_sync_enabled", description: "Sync contacts téléphone → suggestions", enabled: true },
    { key: "qr_relationship_enabled", description: "QR pour jointure relationnelle", enabled: true },
    {
      key: "commercial_identity_enabled",
      description: "Cartes identité commerciale enrichies",
      enabled: true,
    },
    {
      key: "strategic_intelligence_enabled",
      description: "Direction / Strategy industrial command center (Instruction 11)",
      enabled: true,
    },
    {
      key: "strategic_ai_enabled",
      description: "MockAI strategic narrative for Direction pole",
      enabled: true,
    },
    {
      key: "territory_map_enabled",
      description: "Territory opportunity lattice / operational map modes",
      enabled: true,
    },
    {
      key: "market_pressure_enabled",
      description: "Market pressure correlation engine",
      enabled: true,
    },
    {
      key: "commercial_network_enabled",
      description: "Commercial / network intelligence industrial pole (Instruction 12)",
      enabled: true,
    },
    {
      key: "sponsorship_observatory_enabled",
      description: "Sponsorship influence observatory for commercial pole",
      enabled: true,
    },
    {
      key: "retailer_radar_enabled",
      description: "Retailer activity radar segmentation",
      enabled: true,
    },
    {
      key: "relationship_stability_enabled",
      description: "Relationship stability matrix for commercial pole",
      enabled: true,
    },
    {
      key: "commercial_network_ai_enabled",
      description: "Commercial / network pole MockAI briefing (Instruction 12A)",
      enabled: true,
    },
    {
      key: "marketing_activation_enabled",
      description: "Marketing / activation intelligence industrial pole (Instruction 13)",
      enabled: true,
    },
    {
      key: "sponsorship_pressure_enabled",
      description: "Sponsorship pressure observatory for activation pole",
      enabled: true,
    },
    {
      key: "retailer_engagement_enabled",
      description: "Retailer engagement observatory for activation pole",
      enabled: true,
    },
    {
      key: "product_momentum_enabled",
      description: "Product momentum observatory for activation pole",
      enabled: true,
    },
    {
      key: "marketing_activation_ai_enabled",
      description: "Marketing / activation pole MockAI briefing (Instruction 13)",
      enabled: true,
    },
    {
      key: "order_adv_enabled",
      description: "Orders / ADV transactional commerce intelligence pole (Instruction 14)",
      enabled: true,
    },
    {
      key: "conversational_commerce_enabled",
      description: "Commerce-through-messaging observatory for orders/ADV pole",
      enabled: true,
    },
    {
      key: "negotiation_intelligence_enabled",
      description: "Negotiation supervision surface for orders/ADV pole",
      enabled: true,
    },
    {
      key: "reservation_allocation_enabled",
      description: "Reservation / allocation intelligence for orders/ADV pole",
      enabled: true,
    },
    {
      key: "order_adv_ai_enabled",
      description: "Orders / ADV pole MockAI execution briefing (Instruction 14)",
      enabled: true,
    },
    {
      key: "supply_logistics_enabled",
      description: "Supply / logistics intelligence pole (Instruction 15)",
      enabled: true,
    },
    {
      key: "territory_flow_enabled",
      description: "Territory flow radar for supply / logistics pole",
      enabled: true,
    },
    {
      key: "shipment_health_enabled",
      description: "Shipment health observatory for supply / logistics pole",
      enabled: true,
    },
    {
      key: "warehouse_pressure_enabled",
      description: "Warehouse / hub pressure surface for supply / logistics pole",
      enabled: true,
    },
    {
      key: "supply_ai_enabled",
      description: "Supply / logistics pole MockAI logistics briefing (Instruction 15)",
      enabled: true,
    },
    {
      key: "finance_collections_enabled",
      description: "Finance / encaissements intelligence pole (Instruction 16)",
      enabled: true,
    },
    {
      key: "payment_pressure_enabled",
      description: "Payment pressure radar for finance pole",
      enabled: true,
    },
    {
      key: "wallet_liquidity_enabled",
      description: "Wallet / liquidity supervision for finance pole",
      enabled: true,
    },
    {
      key: "credit_risk_enabled",
      description: "Credit risk matrix for finance pole",
      enabled: true,
    },
    {
      key: "finance_ai_enabled",
      description: "Finance pole MockAI strategist briefing (Instruction 16)",
      enabled: true,
    },
    {
      key: "data_intelligence_enabled",
      description: "Data / economic intelligence cross-pole operating layer (Instruction 17)",
      enabled: true,
    },
    {
      key: "predictive_signals_enabled",
      description: "Predictive signals engine for data intelligence pole",
      enabled: true,
    },
    {
      key: "graph_intelligence_enabled",
      description: "Commercial graph intelligence for data intelligence pole",
      enabled: true,
    },
    {
      key: "decision_simulation_enabled",
      description: "Decision simulation / tradeoff engine for data intelligence pole",
      enabled: true,
    },
    {
      key: "data_intelligence_ai_enabled",
      description: "MockAI economic superintelligence briefing for data intelligence pole",
      enabled: true,
    },
    {
      key: "economic_propagation_enabled",
      description: "Economic propagation engine — cross-pole nervous system (Instruction 18.1)",
      enabled: true,
    },
    {
      key: "propagation_simulation_enabled",
      description: "Counterfactual propagation simulation on live snapshot lattice",
      enabled: true,
    },
    {
      key: "cross_pole_propagation_enabled",
      description: "Cross-pole propagation chain evaluation",
      enabled: true,
    },
    {
      key: "economic_shock_detection_enabled",
      description: "Snapshot-derived economic shock detection for propagation engine",
      enabled: true,
    },
    {
      key: "economic_memory_enabled",
      description: "Industrial economic memory — persistence of propagation snapshots (Instruction 18.2)",
      enabled: true,
    },
    {
      key: "crisis_signature_enabled",
      description: "Analytic crisis signature extraction into economic memory store",
      enabled: true,
    },
    {
      key: "temporal_analysis_enabled",
      description: "Temporal economic rollup snapshots derived from stored memory",
      enabled: true,
    },
    {
      key: "economic_memory_ai_enabled",
      description: "MockAI industrial economic memory briefing (Instruction 18.2)",
      enabled: true,
    },
    {
      key: "economic_scenarios_enabled",
      description: "Industrial economic scenario engine — deterministic projections (Instruction 18.3)",
      enabled: true,
    },
    {
      key: "scenario_risk_enabled",
      description: "Expose heuristic risk lattice for economic scenarios pole",
      enabled: true,
    },
    {
      key: "scenario_memory_enabled",
      description: "Link economic scenarios to persisted economic memory (18.2)",
      enabled: true,
    },
    {
      key: "scenario_stabilization_enabled",
      description: "Expose stabilization direction proposals for economic scenarios",
      enabled: true,
    },
    {
      key: "economic_scenarios_ai_enabled",
      description: "MockAI economic scenario briefing (Instruction 18.3)",
      enabled: true,
    },
    {
      key: "economic_coordination_enabled",
      description: "Industrial economic coordination layer — cross-pole orchestration readout (Instruction 18.4)",
      enabled: true,
    },
    {
      key: "coordination_conflict_enabled",
      description: "Expose coordination conflict matrix heuristics (18.4)",
      enabled: true,
    },
    {
      key: "coordination_memory_enabled",
      description: "Expose coordination memory / recurrence heuristics (18.4)",
      enabled: true,
    },
    {
      key: "coordination_orchestration_enabled",
      description: "Expose symbolic response orchestration sequences (18.4)",
      enabled: true,
    },
    {
      key: "economic_escalation_enabled",
      description: "Expose systemic escalation ladder readout (18.4)",
      enabled: true,
    },
    {
      key: "economic_command_enabled",
      description: "Industrial economic command cockpit — executive advisory readout (Instruction 18.5)",
      enabled: true,
    },
    {
      key: "economic_command_risk_enabled",
      description: "Expose advisory decision-risk heuristics in economic command (18.5)",
      enabled: true,
    },
    {
      key: "economic_command_arbitration_enabled",
      description: "Expose symbolic pole arbitration readouts in economic command (18.5)",
      enabled: true,
    },
    {
      key: "economic_command_tension_enabled",
      description: "Expose silent tension micro-signals in economic command (18.5)",
      enabled: true,
    },
    {
      key: "economic_command_realtime_enabled",
      description: "Fan-out economic command pulses to realtime gateway (18.5)",
      enabled: true,
    },
    {
      key: "industrial_situation_room_enabled",
      description: "Industrial situation room — symbolic crisis cockpit above economic command (Instruction 18.6)",
      enabled: true,
    },
    {
      key: "industrial_situation_room_realtime_enabled",
      description: "Fan-out industrial situation room pulses to realtime gateway (18.6)",
      enabled: true,
    },
    {
      key: "industrial_operational_continuity_enabled",
      description: "Industrial operational continuity — symbolic stability layer above situation room (Instruction 18.7)",
      enabled: true,
    },
    {
      key: "industrial_operational_continuity_realtime_enabled",
      description: "Fan-out industrial operational continuity pulses to realtime gateway (18.7)",
      enabled: true,
    },
    {
      key: "industrial_evidence_enabled",
      description: "Industrial evidence — provenance, trust matrix, derived traces (non-causal), limitations (18.8)",
      enabled: true,
    },
    {
      key: "industrial_evidence_realtime_enabled",
      description: "Fan-out industrial evidence registry pulses to realtime gateway (18.8)",
      enabled: true,
    },
    {
      key: "industrial_evidence_trace_enabled",
      description: "Expose illustrative derived correlation traces in industrial evidence (18.8)",
      enabled: true,
    },
    {
      key: "industrial_evidence_limitations_enabled",
      description: "Expose limitation engine rows in industrial evidence (18.8)",
      enabled: true,
    },
    {
      key: "commercial_relationship_graph_enabled",
      description: "Commercial relationship graph — validated closed graph projection (19.1)",
      enabled: true,
    },
    {
      key: "commercial_relationship_graph_realtime_enabled",
      description: "Fan-out commercial relationship graph pulses to realtime gateway (19.1)",
      enabled: true,
    },
    {
      key: "commercial_relationship_graph_coverage_enabled",
      description: "Include symbolic coverage model in commercial relationship graph bundle (19.1)",
      enabled: true,
    },
    {
      key: "commercial_relationship_graph_chains_enabled",
      description: "Include producer→retailer chain enumeration in full graph bundle (19.1)",
      enabled: true,
    },
    {
      key: "relational_catalog_enabled",
      description: "Relational catalog layer — relationship-scoped catalogs/products (19.2)",
      enabled: true,
    },
    {
      key: "relational_catalog_realtime_enabled",
      description: "Fan-out relational catalog pulses to realtime gateway (19.2)",
      enabled: true,
    },
    {
      key: "relational_cart_enabled",
      description: "Instruction 20.6A — pôle panier relationnel (préparation corridor, pas checkout public).",
      enabled: true,
    },
    {
      key: "relational_cart_realtime_enabled",
      description: "Temps réel minimal pour le pôle panier relationnel (événements relational.cart.* filtrés).",
      enabled: true,
    },
    {
      key: "relational_cart_review_enabled",
      description: "Instruction 20.7 — revue panier relationnelle (pas checkout public).",
      enabled: true,
    },
    {
      key: "relational_cart_dual_confirmation_enabled",
      description: "Instruction 20.7 — double confirmation acheteur / vendeur corridor.",
      enabled: true,
    },
    {
      key: "relational_cart_lock_enabled",
      description: "Instruction 20.7 — verrouillage panier avant conversion commande relationnelle.",
      enabled: true,
    },
    {
      key: "relational_cart_direct_catalog_enabled",
      description:
        "Instruction 20.6 — commande directe catalogue relationnel → panier relationnel (corridor, pas marketplace public).",
      enabled: true,
    },
    {
      key: "relational_cart_direct_catalog_realtime_enabled",
      description: "Fan-out relational.cart.catalog_item_added vers gateway (20.6, payload minimal).",
      enabled: true,
    },
    {
      key: "relational_orders_enabled",
      description: "Relational orders read layer — corridor-scoped Prisma orders + graph 19.1A (20.0)",
      enabled: true,
    },
    {
      key: "relational_orders_realtime_enabled",
      description: "Fan-out relational orders pulses to realtime gateway (20.0)",
      enabled: true,
    },
    {
      key: "relational_order_execution_enabled",
      description:
        "Instruction 20.8 — moteur d'exécution commande relationnelle (corridor, pas tracking consommateur ni checkout public).",
      enabled: true,
    },
    {
      key: "relational_fulfillment_enabled",
      description:
        "Instruction 20.9 — fulfillment relationnel post-exécution (preuve réception, corridor B2B, pas livraison grand public).",
      enabled: true,
    },
    {
      key: "relational_fulfillment_realtime_enabled",
      description: "Fan-out relational.fulfillment.* vers gateway (20.9, payload strict sans GPS).",
      enabled: true,
    },
    {
      key: "relational_fulfillment_proof_enabled",
      description: "Soumission preuves réception / chargement corridor (20.9).",
      enabled: true,
    },
    {
      key: "relational_fulfillment_incident_resolution_enabled",
      description:
        "Instruction 20.10 — résolution incidents fulfillment corridor (rejet réception, partiel, double acceptation partenaires).",
      enabled: true,
    },
    {
      key: "relational_fulfillment_coordination_enabled",
      description:
        "Instruction 20.11 — tâches coordination opérationnelle fulfillment corridor (pas ticketing SAV marketplace).",
      enabled: true,
    },
    {
      key: "relational_fulfillment_coordination_realtime_enabled",
      description: "Fan-out relational.fulfillment.task_* vers gateway (20.11, payload strict).",
      enabled: true,
    },
    {
      key: "relational_operational_intelligence_enabled",
      description:
        "Instruction 20.12 — intelligence opérationnelle corridor (SLA, alertes, métriques — pas dashboard ecommerce).",
      enabled: true,
    },
    {
      key: "relational_operational_realtime_enabled",
      description: "Fan-out relational.operational.* vers gateway (20.12, payload strict).",
      enabled: true,
    },
    {
      key: "relational_predictive_risk_enabled",
      description:
        "Instruction 20.13 — moteur prédictif opérationnel déterministe (drift, collapse, risques corridor — pas LLM).",
      enabled: true,
    },
    {
      key: "relational_predictive_realtime_enabled",
      description: "Fan-out relational.predictive.* vers gateway (20.13, payload strict).",
      enabled: true,
    },
    {
      key: "relational_operational_recommendation_enabled",
      description:
        "Instruction 20.14 — moteur de recommandations opérationnelles déterministes (SLA, incidents, gouvernance — pas LLM).",
      enabled: true,
    },
    {
      key: "relational_operational_recommendation_realtime_enabled",
      description: "Fan-out relational.operational.recommendation_* vers gateway (20.14, payload strict).",
      enabled: true,
    },
    {
      key: "relational_operational_orchestration_enabled",
      description:
        "Instruction 20.15 — orchestration opérationnelle déterministe (plans, étapes, validation humaine — pas autopilot).",
      enabled: true,
    },
    {
      key: "relational_operational_orchestration_realtime_enabled",
      description: "Fan-out relational.operational.orchestration_* vers gateway (20.15, payload strict).",
      enabled: true,
    },
    {
      key: "relational_operational_simulation_enabled",
      description:
        "Instruction 20.16 — simulation opérationnelle déterministe (stress, propagation — pas mutation réelle).",
      enabled: true,
    },
    {
      key: "relational_operational_simulation_realtime_enabled",
      description: "Fan-out relational.operational.simulation_* vers gateway (20.16, payload strict).",
      enabled: true,
    },
    {
      key: "relational_scenario_review_enabled",
      description:
        "Instruction 20.17 — comité de revue scénario corridor (validation humaine, audit décisionnel — pas autopilot).",
      enabled: true,
    },
    {
      key: "relational_scenario_review_realtime_enabled",
      description: "Fan-out relational.scenario.review_* vers gateway (20.17, payload strict).",
      enabled: true,
    },
    {
      key: "relational_strategic_memory_enabled",
      description:
        "Instruction 20.18 — registre mémoire stratégique corridor (patterns déterministes, capitalisation — pas ML opaque).",
      enabled: true,
    },
    {
      key: "relational_strategic_memory_realtime_enabled",
      description: "Fan-out relational.memory.* vers gateway (20.18, payload strict).",
      enabled: true,
    },
    {
      key: "relational_economic_signal_graph_enabled",
      description:
        "Instruction 20.19 — graphe signaux économiques relationnels (corrélation corridor, propagation, clusters — pas wallet ni tracking public).",
      enabled: true,
    },
    {
      key: "relational_economic_signal_graph_realtime_enabled",
      description: "Fan-out relational.economic.* vers gateway (20.19, payload strict).",
      enabled: true,
    },
    {
      key: "relational_economic_command_center_enabled",
      description:
        "Instruction 20.20 — centre de commande économique relationnel (supervision corridor multi-signaux, pas dashboard ecommerce).",
      enabled: true,
    },
    {
      key: "relational_economic_command_center_realtime_enabled",
      description: "Fan-out relational.command.* vers gateway (20.20, payload strict).",
      enabled: true,
    },
    {
      key: "relational_economic_pressure_enabled",
      description:
        "Instruction 20.21 — cartographie pression & dépendances corridor (déterministe, pas GPS ni wallet).",
      enabled: true,
    },
    {
      key: "relational_economic_pressure_realtime_enabled",
      description: "Fan-out relational.pressure.* vers gateway (20.21, payload strict).",
      enabled: true,
    },
    {
      key: "relational_geo_economic_enabled",
      description:
        "Instruction 20.22 — intelligence géo-économique territoriale analytique (pas GPS, pas tracking livraison).",
      enabled: true,
    },
    {
      key: "relational_geo_economic_realtime_enabled",
      description: "Fan-out relational.geo.* vers gateway (20.22, payload strict, avant relational.pressure.*).",
      enabled: true,
    },
    {
      key: "relational_sector_intelligence_enabled",
      description:
        "Instruction 20.23 — intelligence sectorielle & structure de marché (déterministe, pas ERP/CRM, pas IA générative).",
      enabled: true,
    },
    {
      key: "relational_sector_realtime_enabled",
      description:
        "Fan-out relational.sector.* vers gateway (20.23, payload strict, avant relational.geo.* / pressure / command / economic).",
      enabled: true,
    },
    {
      key: "relational_supply_flow_enabled",
      description:
        "Instruction 20.24 — intelligence des flux d’approvisionnement corridor (lecture, pas TMS/WMS, pas tracking livraison).",
      enabled: true,
    },
    {
      key: "relational_supply_flow_realtime_enabled",
      description:
        "Fan-out relational.supply.* vers gateway (20.24, payload strict, avant relational.sector.*).",
      enabled: true,
    },
    {
      key: "relational_macro_economic_enabled",
      description:
        "Instruction 20.25 — résilience macro-économique relationnelle & intelligence adaptive corridor (lecture, pas ERP, pas scoring public).",
      enabled: true,
    },
    {
      key: "relational_macro_economic_realtime_enabled",
      description:
        "Fan-out relational.macro.* vers gateway (20.25, payload strict, avant relational.supply.*).",
      enabled: true,
    },
    {
      key: "relational_economic_continuity_enabled",
      description:
        "Instruction 20.26 — stabilité & continuité économique relationnelle (lecture industrielle, pas ERP, pas autopilot).",
      enabled: true,
    },
    {
      key: "relational_economic_continuity_realtime_enabled",
      description:
        "Fan-out relational.continuity.* vers gateway (20.26, payload strict, avant relational.macro.*).",
      enabled: true,
    },
    {
      key: "relational_economic_sovereignty_enabled",
      description:
        "Instruction 20.27 — souveraineté économique & autonomie corridor (lecture industrielle, pas ERP, pas scoring public).",
      enabled: true,
    },
    {
      key: "relational_economic_sovereignty_realtime_enabled",
      description:
        "Fan-out relational.sovereignty.* vers gateway (20.27, payload strict, avant relational.continuity.*).",
      enabled: true,
    },
    {
      key: "relational_economic_recovery_enabled",
      description:
        "Instruction 20.29 — planification de reprise économique corridor (lecture, séquencement, pas autopilot ni mutation commerciale).",
      enabled: true,
    },
    {
      key: "relational_economic_recovery_realtime_enabled",
      description:
        "Fan-out relational.recovery.* vers gateway (20.29, payload strict, avant relational.sovereignty.*).",
      enabled: true,
    },
    {
      key: "relational_economic_governance_enabled",
      description:
        "Instruction 20.30 — gouvernance économique multi-corridor (coordination, conflits, arbitrage analytique, pas autopilot).",
      enabled: true,
    },
    {
      key: "relational_economic_governance_realtime_enabled",
      description:
        "Fan-out relational.governance.* vers gateway (20.30, payload strict, avant relational.recovery.*).",
      enabled: true,
    },
    {
      key: "relational_economic_arbitration_enabled",
      description:
        "Instruction 20.31 — arbitrage économique relationnel (scénarios, décisions journalisées, pas exécution commerciale).",
      enabled: true,
    },
    {
      key: "relational_economic_arbitration_realtime_enabled",
      description:
        "Fan-out relational.arbitration.* vers gateway (20.31, payload strict, avant relational.governance.*).",
      enabled: true,
    },
    {
      key: "relational_economic_stabilization_enabled",
      description:
        "Instruction 20.32 — stabilisation économique multi-corridor (résilience, corridors fragiles, pas exécution opérationnelle).",
      enabled: true,
    },
    {
      key: "relational_economic_stabilization_realtime_enabled",
      description:
        "Fan-out relational.stabilization.* vers gateway (20.32, payload strict, avant relational.arbitration.*).",
      enabled: true,
    },
    {
      key: "relational_economic_monitoring_enabled",
      description:
        "Instruction 20.33 — supervision stratégique exécutive (stabilité systémique, alertes, pas exécution opérationnelle).",
      enabled: true,
    },
    {
      key: "relational_economic_monitoring_realtime_enabled",
      description:
        "Fan-out relational.monitoring.* vers gateway (20.33, payload strict, avant relational.stabilization.*).",
      enabled: true,
    },
    {
      key: "relational_executive_orchestration_enabled",
      description:
        "Instruction 20.34 — orchestration exécutive économique multi-corridor (matrice stratégique, pas exécution opérationnelle).",
      enabled: true,
    },
    {
      key: "relational_executive_orchestration_realtime_enabled",
      description:
        "Fan-out relational.executive_orchestration.* vers gateway (20.34, payload strict, avant relational.monitoring.*).",
      enabled: true,
    },
    {
      key: "relational_institutional_reporting_enabled",
      description:
        "Instruction 20.35 — reporting institutionnel et briefs stratégiques (templates déterministes, pas LLM).",
      enabled: true,
    },
    {
      key: "relational_institutional_reporting_realtime_enabled",
      description:
        "Fan-out relational.institutional_reporting.* vers gateway (20.35, payload strict, avant relational.executive_orchestration.*).",
      enabled: true,
    },
    {
      key: "relational_strategic_intelligence_enabled",
      description:
        "Instruction 20.36 — consolidation stratégique et synthèses exécutives déterministes (pas LLM).",
      enabled: true,
    },
    {
      key: "relational_strategic_intelligence_realtime_enabled",
      description:
        "Fan-out relational.strategic_intelligence.* vers gateway (20.36, payload strict, avant relational.institutional_reporting.*).",
      enabled: true,
    },
    {
      key: "relational_strategic_command_enabled",
      description:
        "Instruction 20.37 — command center stratégique et grilles de supervision systémique (déterministe, pas LLM).",
      enabled: true,
    },
    {
      key: "relational_strategic_command_realtime_enabled",
      description:
        "Fan-out relational.strategic_command.* vers gateway (20.37, payload strict, avant relational.strategic_intelligence.*).",
      enabled: true,
    },
    {
      key: "relational_executive_operations_enabled",
      description:
        "Instruction 20.38 — opérations exécutives stratégiques et matrices de supervision décisionnelle (déterministe, pas LLM).",
      enabled: true,
    },
    {
      key: "relational_executive_operations_realtime_enabled",
      description:
        "Fan-out relational.executive_operations.* vers gateway (20.38, payload strict, avant relational.strategic_command.*).",
      enabled: true,
    },
    {
      key: "relational_executive_control_room_enabled",
      description:
        "Instruction 20.39 — salle de contrôle exécutive et decision boards stratégiques (déterministe, pas LLM).",
      enabled: true,
    },
    {
      key: "relational_executive_control_room_realtime_enabled",
      description:
        "Fan-out relational.executive_control_room.* vers gateway (20.39, payload strict, avant relational.executive_operations.*).",
      enabled: true,
    },
    {
      key: "relational_executive_strategic_synthesis_enabled",
      description:
        "Instruction 20.40 — synthèse exécutive stratégique et digests de supervision globale (déterministe, pas LLM).",
      enabled: true,
    },
    {
      key: "relational_executive_strategic_synthesis_realtime_enabled",
      description:
        "Fan-out relational.executive_strategic_synthesis.* vers gateway (20.40, payload strict, avant relational.executive_control_room.*).",
      enabled: true,
    },
    {
      key: "relational_global_executive_supervision_enabled",
      description:
        "Instruction 20.41 — supervision exécutive globale et matrices de coordination maître (déterministe, pas LLM).",
      enabled: true,
    },
    {
      key: "relational_global_executive_supervision_realtime_enabled",
      description:
        "Fan-out relational.global_executive_supervision.* vers gateway (20.41, payload strict, avant relational.executive_strategic_synthesis.*).",
      enabled: true,
    },
    {
      key: "relational_strategic_observatory_enabled",
      description:
        "Instruction 20.42 — observatoire économique stratégique et grilles de coordination macro (déterministe, pas LLM).",
      enabled: true,
    },
    {
      key: "relational_strategic_observatory_realtime_enabled",
      description:
        "Fan-out relational.strategic_observatory.* vers gateway (20.42, payload strict, avant relational.global_executive_supervision.*).",
      enabled: true,
    },
    {
      key: "relational_macro_observatory_governance_enabled",
      description:
        "Instruction 20.43 — gouvernance macro-observatoire et coordination réseau exécutive (déterministe, pas LLM).",
      enabled: true,
    },
    {
      key: "relational_macro_observatory_governance_realtime_enabled",
      description:
        "Fan-out relational.macro_observatory_governance.* vers gateway (20.43, payload strict, avant relational.strategic_observatory.*).",
      enabled: true,
    },
    {
      key: "producer_industrial_web_enabled",
      description:
        "Instruction 20.45 — cockpit web producteur / industriel V1 (premier produit terrain, mocks + navigation 6 pôles).",
      enabled: true,
    },
    {
      key: "producer_industrial_live_data_enabled",
      description:
        "Instruction 20.46 — branchement données live BFF producteur (DEV on, PROD off par défaut côté client).",
      enabled: true,
    },
    {
      key: "producer_relational_commercial_workspace_enabled",
      description:
        "Instruction 20.47 — espace opérationnel réseau commercial producteur (partenaires, commandes, corridors).",
      enabled: true,
    },
    {
      key: "producer_order_fulfillment_workspace_enabled",
      description:
        "Instruction 20.48 — espace commandes & fulfillment producteur (exécution, incidents, preuves terrain).",
      enabled: true,
    },
    {
      key: "producer_commercial_mail_enabled",
      description:
        "Instruction 20.67 — boîte mail réseau commercial producteur (mails professionnels, pas de chat).",
      enabled: true,
    },
    {
      key: "producer_catalog_workspace_enabled",
      description:
        "Instruction 20.49 — espace catalogue & intelligence produit producteur (performance, demande, territoires).",
      enabled: true,
    },
    {
      key: "producer_territory_distribution_workspace_enabled",
      description:
        "Instruction 20.50 — espace territoires & distribution producteur (corridors, couverture, distributeurs).",
      enabled: true,
    },
    {
      key: "producer_marketing_activation_workspace_enabled",
      description:
        "Instruction 20.51 — espace marketing & activation producteur (campagnes, momentum, distributeurs).",
      enabled: true,
    },
    {
      key: "producer_supply_logistics_workspace_enabled",
      description:
        "Instruction 20.52 — espace supply & logistique producteur (flux, hubs, corridors, livraisons).",
      enabled: true,
    },
    {
      key: "producer_finance_collections_workspace_enabled",
      description:
        "Instruction 20.53 — espace finance & encaissements producteur (stabilité, partenaires, revenus).",
      enabled: true,
    },
    {
      key: "producer_data_intelligence_workspace_enabled",
      description:
        "Instruction 20.54 — espace data & intelligence producteur (signaux, suggestions, présence discrète).",
      enabled: true,
    },
    {
      key: "grossiste_b_mobile_enabled",
      description:
        "Instruction 20.55 — application mobile grossiste catégorie B (6 onglets, live/fallback 20.46).",
      enabled: true,
    },
    {
      key: "grossiste_b_commerce_messaging_enabled",
      description:
        "Instruction 20.61 — messagerie commerciale mobile Grossiste B (commerce-messaging injecté, terrain).",
      enabled: true,
    },
    {
      key: "detaillant_mobile_enabled",
      description:
        "Instruction 20.56 — application mobile détaillant (6 onglets, vente terrain, live/fallback 20.46).",
      enabled: true,
    },
    {
      key: "detaillant_commerce_messaging_enabled",
      description:
        "Instruction 20.62 — messagerie commerciale mobile détaillant (optionnelle, commande rapide sans discussion).",
      enabled: true,
    },
    {
      key: "grossiste_a_web_enabled",
      description:
        "Instruction 20.57 — espace web Grossiste A (9 workspaces, distribution, intelligence discrète).",
      enabled: true,
    },
    {
      key: "grossiste_a_commerce_messaging_enabled",
      description:
        "Instruction 20.59 — messagerie commerciale Grossiste A (commerce-messaging injecté, pas de chat social).",
      enabled: true,
    },
    {
      key: "commerce_messaging_enabled",
      description:
        "Instruction 20.58 — messagerie commerciale vivante transverse (conversations commerce-first, live/fallback 20.46).",
      enabled: true,
    },
    {
      key: "commerce_wallet_enabled",
      description:
        "Instruction 20.63 — wallet & paiements relationnels transverse (règlements commerce-first, fondation).",
      enabled: true,
    },
    {
      key: "commerce_partner_payments_enabled",
      description:
        "Instruction 20.63 — paiements partenaires commerce (règlements relationnels, pas fintech).",
      enabled: true,
    },
    {
      key: "commerce_hybrid_settlement_enabled",
      description:
        "Instruction 20.64 — règlements hybrides cash + électronique (commerce-first, suivi terrain).",
      enabled: true,
    },
    {
      key: "commerce_manual_confirmation_enabled",
      description:
        "Instruction 20.64 — confirmation manuelle terrain (hors plateforme, partenaire réseau).",
      enabled: true,
    },
    {
      key: "producer_wallet_enabled",
      description:
        "Instruction 20.65 — règlements partenaires producteur (virements, confirmations terrain).",
      enabled: true,
    },
    {
      key: "grossiste_a_wallet_enabled",
      description:
        "Instruction 20.65 — règlements commerciaux Grossiste A (web structuré).",
      enabled: true,
    },
    {
      key: "grossiste_b_wallet_enabled",
      description:
        "Instruction 20.65 — règlements terrain Grossiste B (mobile money, cash).",
      enabled: true,
    },
    {
      key: "detaillant_wallet_enabled",
      description:
        "Instruction 20.65 — règlements simples détaillant (optionnel, cash/mobile).",
      enabled: true,
    },
    {
      key: "commerce_linked_context_enabled",
      description:
        "Instruction 20.66 — liaison contextuelle messagerie ↔ commande ↔ règlement.",
      enabled: true,
    },
    {
      key: "commerce_linked_timeline_enabled",
      description:
        "Instruction 20.66 — timeline commerciale liée dans les conversations.",
      enabled: true,
    },
    {
      key: "commercial_network_discovery_enabled",
      description:
        "Instruction 20.68 — découverte réseau terrain Grossiste B ↔ Détaillant (contacts téléphone, suggestions naturelles).",
      enabled: true,
    },
    {
      key: "commercial_auto_accept_enabled",
      description:
        "Instruction 20.68 — connexion commerciale immédiate terrain (auto-accept optionnel).",
      enabled: true,
    },
    {
      key: "commercial_contact_first_identity_enabled",
      description:
        "Instruction 20.70 — identité relationnelle terrain contact-first (Grossiste B / Détaillant).",
      enabled: true,
    },
    {
      key: "commercial_activity_based_suggestions_enabled",
      description:
        "Instruction 20.70 — suggestions hors carnet selon activité / zone (terrain).",
      enabled: true,
    },
    {
      key: "relational_catalog_enabled",
      description:
        "Instruction 20.71 — catalogues relationnels fermés par partenaire (pas de marketplace globale).",
      enabled: true,
    },
    {
      key: "sponsored_catalog_discovery_enabled",
      description:
        "Instruction 20.71 — découverte sponsorisée légère dans le corridor commercial.",
      enabled: true,
    },
    {
      key: "partner_catalog_visibility_enabled",
      description:
        "Instruction 20.71 — visibilité catalogue selon relation partenaire active.",
      enabled: true,
    },
    {
      key: "terrain_quick_onboarding_enabled",
      description:
        "Instruction 20.72 — inscription terrain ultra légère Grossiste B / Détaillant (téléphone, pseudo, activités, ville).",
      enabled: true,
    },
    {
      key: "terrain_pseudo_identity_enabled",
      description:
        "Instruction 20.72 — identité flexible pseudo/nom terrain (boutique secondaire, contact-first).",
      enabled: true,
    },
    {
      key: "relational_order_orchestration_enabled",
      description:
        "Instruction 20.73 — orchestration cycle commercial commandes relationnelles (validation → clôture).",
      enabled: true,
    },
    {
      key: "commercial_delivery_flow_enabled",
      description:
        "Instructions 20.73–20.74 — flux livraison relationnelle commercial léger (pas TMS/WMS/ERP).",
      enabled: true,
    },
    {
      key: "commercial_reception_confirmation_enabled",
      description:
        "Instruction 20.74 — confirmation réception terrain simple (Détaillant / Grossiste B).",
      enabled: true,
    },
    {
      key: "commercial_delivery_activity_enabled",
      description:
        "Instruction 20.74 — fil activité commerciale liée aux livraisons (commande, wallet, corridor).",
      enabled: true,
    },
    {
      key: "commercial_settlement_flow_enabled",
      description:
        "Instruction 20.73 — règlement commercial optionnel lié aux commandes (wallet / terrain).",
      enabled: true,
    },
    {
      key: "commerce_foundation_guardrails_enabled",
      description:
        "Instruction 20.74-A — garde-fous transverses commerce-first (wording, navigation, philosophie).",
      enabled: true,
    },
    {
      key: "commerce_navigation_consistency_enabled",
      description:
        "Instruction 20.74-A — cohérence navigation légère (un panneau actif, pas de tunnel).",
      enabled: true,
    },
    {
      key: "commerce_anti_erp_wording_enabled",
      description:
        "Instruction 20.74-A — sanitization anti-ERP / supply chain / fintech / social.",
      enabled: true,
    },
    {
      key: "commercial_relationship_governance_enabled",
      description:
        "Instruction 20.75 — gouvernance relationnelle multi-niveaux (matrice, communication, identité par relation).",
      enabled: true,
    },
    {
      key: "commercial_multi_level_network_enabled",
      description:
        "Instruction 20.75 — réseau commercial multi-niveaux gouverné (pas marketplace publique).",
      enabled: true,
    },
    {
      key: "commercial_relationship_context_enabled",
      description:
        "Instruction 20.75 — contexte linked-commerce par type de relation (commande, règlement, livraison).",
      enabled: true,
    },
    {
      key: "commercial_context_routing_enabled",
      description:
        "Instruction 20.76 — routing contextuel commerce-first entre catalogue, commande, livraison, wallet, messaging, mail.",
      enabled: true,
    },
    {
      key: "commercial_context_history_enabled",
      description:
        "Instruction 20.76 — historique UX léger (dernier partenaire, commande, conversation) — pas audit ERP.",
      enabled: true,
    },
    {
      key: "commercial_cross_module_navigation_enabled",
      description:
        "Instruction 20.76 — navigation inter-modules inline et contextuelle (un contexte actif).",
      enabled: true,
    },
    {
      key: "venext_i18n_enabled",
      description:
        "Instruction 20.77 — internationalisation métier native FR / EN / AR / ZH.",
      enabled: true,
    },
    {
      key: "venext_rtl_enabled",
      description: "Instruction 20.77 — support RTL pour l'arabe.",
      enabled: true,
    },
    {
      key: "venext_multilingual_guardrails_enabled",
      description:
        "Instruction 20.77 — anti-jargon multilingue commerce-first (ERP, fintech, social).",
      enabled: true,
    },
    {
      key: "venext_auth_foundation_enabled",
      description:
        "Instruction 20.78 — fondation authentification légère, session acteur et profil commerce-first.",
      enabled: true,
    },
    {
      key: "venext_session_restore_enabled",
      description: "Instruction 20.78 — restauration session et contexte commercial au retour.",
      enabled: true,
    },
    {
      key: "venext_profile_foundation_enabled",
      description:
        "Instruction 20.78 — profil minimal terrain/formel (pas réseau social, pas KYC).",
      enabled: true,
    },
    {
      key: "terrain_unlimited_session_enabled",
      description:
        "Instruction 20.78-A — session terrain illimitée tant que solde wallet < 1000 FCFA.",
      enabled: true,
    },
    {
      key: "wallet_adaptive_security_enabled",
      description:
        "Instruction 20.78-A — sécurité wallet adaptative (léger vs BCEAO selon solde réel).",
      enabled: true,
    },
    {
      key: "wallet_bceao_kyc_enabled",
      description:
        "Instruction 20.78-A — KYC BCEAO uniquement pour recevoir, conserver ou payer via wallet.",
      enabled: true,
    },
    {
      key: "wallet_biometric_unlock_enabled",
      description: "Instruction 20.78-A — déverrouillage biométrique optionnel du wallet.",
      enabled: true,
    },
    {
      key: "wallet_instant_background_lock_enabled",
      description:
        "Instruction 20.78-B — verrouillage wallet immédiat à la sortie ou mise en arrière-plan (terrain sécurisé).",
      enabled: true,
    },
    {
      key: "wallet_ultra_short_timeout_enabled",
      description:
        "Instruction 20.78-B — timeout inactivité wallet terrain 20 secondes (session sécurisée).",
      enabled: true,
    },
    {
      key: "venext_backend_persistence_enabled",
      description:
        "Instruction 20.79 — persistance backend réelle fondations métier (démo, pas banque réelle).",
      enabled: true,
    },
    {
      key: "venext_bff_routes_enabled",
      description: "Instruction 20.79 — routes BFF /api pour fondations commerce.",
      enabled: true,
    },
    {
      key: "venext_live_data_fallback_enabled",
      description:
        "Instruction 20.79 — fallback mock local si BFF/backend indisponible.",
      enabled: true,
    },
    {
      key: "commerce_notifications_enabled",
      description:
        "Instruction 20.80 — centre de notifications commerce-first (pas réseau social).",
      enabled: true,
    },
    {
      key: "commerce_notification_preferences_enabled",
      description: "Instruction 20.80 — préférences notifications par catégorie.",
      enabled: true,
    },
    {
      key: "commerce_notification_context_routing_enabled",
      description:
        "Instruction 20.80 — ouverture contextuelle commande/livraison/mail depuis notification.",
      enabled: true,
    },
    {
      key: "commercial_activity_feed_enabled",
      description:
        "Instruction 20.81 — fil d'activité commerce-first relationnel (pas réseau social).",
      enabled: true,
    },
    {
      key: "commercial_activity_timeline_enabled",
      description: "Instruction 20.81 — timeline légère aujourd'hui / hier / semaine.",
      enabled: true,
    },
    {
      key: "commercial_activity_grouping_enabled",
      description: "Instruction 20.81 — regroupement intelligent par catégorie commerce.",
      enabled: true,
    },
    {
      key: "commerce_offline_foundation_enabled",
      description:
        "Instruction 20.82 — fondation offline commerce légère (cache terrain, pas ERP mobile).",
      enabled: true,
    },
    {
      key: "commerce_offline_sync_enabled",
      description: "Instruction 20.82 — synchronisation manuelle au retour en ligne.",
      enabled: true,
    },
    {
      key: "commerce_offline_queue_enabled",
      description: "Instruction 20.82 — file d'attente actions commerce hors ligne.",
      enabled: true,
    },
    {
      key: "commerce_access_control_enabled",
      description:
        "Instruction 20.83 — contrôle d'accès commerce-first relationship-first.",
      enabled: true,
    },
    {
      key: "commerce_visibility_guard_enabled",
      description: "Instruction 20.83 — garde visibilité relationnelle frontend.",
      enabled: true,
    },
    {
      key: "commerce_backend_access_guard_enabled",
      description: "Instruction 20.83 — garde accès routes BFF/backend.",
      enabled: true,
    },
    {
      key: "commerce_ux_harmony_enabled",
      description:
        "Instruction 20.84 — harmonisation UX légère mobile/web (empty states, tokens, anti-jargon).",
      enabled: true,
    },
    {
      key: "commerce_performance_foundation_enabled",
      description:
        "Instruction 20.85 — performance & stabilité V1 (virtualisation légère, cleanup cache, pas de polling).",
      enabled: true,
    },
    {
      key: "commerce_secure_cleanup_enabled",
      description:
        "Instruction 20.85-A — cleanup session complet (logout, suspension, archivage).",
      enabled: true,
    },
    {
      key: "commerce_light_virtualization_enabled",
      description:
        "Instruction 20.85-A — fenêtres visibles messaging/catalogue (40/30 max).",
      enabled: true,
    },
    {
      key: "commerce_secure_wallet_navigation_enabled",
      description:
        "Instruction 20.85-A — reset navigation wallet sécurisé après lock.",
      enabled: true,
    },
    {
      key: "commerce_humanized_errors_enabled",
      description:
        "Instruction 20.84-A — humanisation globale des erreurs, anti-panique utilisateur.",
      enabled: true,
    },
    {
      key: "venext_v1_readiness_enabled",
      description:
        "Instruction 20.86 — audit final V1, gel fonctionnel, production readiness (préproduction).",
      enabled: true,
    },
    {
      key: "enterprise_governance_enabled",
      description:
        "Instruction 20.86-A — gouvernance grands comptes (Producteur / Grossiste A), onboarding supervisé.",
      enabled: true,
    },
    {
      key: "enterprise_secure_channels_enabled",
      description: "Instruction 20.86-A — canaux entreprise sécurisés et liens éphémères.",
      enabled: true,
    },
    {
      key: "enterprise_controlled_onboarding_enabled",
      description: "Instruction 20.86-A — activation contrôlée des pôles VENEXT existants.",
      enabled: true,
    },
    {
      key: "enterprise_security_governance_enabled",
      description:
        "Instruction 20.86-B — gouvernance sécurité interne, archivage supervisé, actions motivées.",
      enabled: true,
    },
    {
      key: "enterprise_archive_workflow_enabled",
      description: "Instruction 20.86-B — workflow archivage entreprise (VENEXT Global).",
      enabled: true,
    },
    {
      key: "enterprise_internal_security_enabled",
      description: "Instruction 20.86-B — workspace sécurité partenaire (accès internes).",
      enabled: true,
    },
    {
      key: "enterprise_runtime_security_enabled",
      description:
        "Instruction 20.86-D — cleanup runtime sécurité (sessions, cache, navigation).",
      enabled: true,
    },
    {
      key: "enterprise_invitation_revocation_enabled",
      description: "Instruction 20.86-D — révocation invitations entreprise.",
      enabled: true,
    },
    {
      key: "enterprise_navigation_lock_enabled",
      description: "Instruction 20.86-D — verrou navigation après suspension/archivage.",
      enabled: true,
    },
    {
      key: "enterprise_append_only_history_enabled",
      description: "Instruction 20.86-D — historique gouvernance append-only.",
      enabled: true,
    },
    {
      key: "professional_commercial_network_enabled",
      description:
        "Instruction 20.69 — réseau commercial professionnel Producteur ↔ Grossiste A (invitation, validation, réseau fermé).",
      enabled: true,
    },
    {
      key: "producer_partner_network_enabled",
      description:
        "Instruction 20.69 — réseau partenaires B2B producteur industriel.",
      enabled: true,
    },
    {
      key: "grossiste_a_partner_network_enabled",
      description:
        "Instruction 20.69 — réseau partenaires producteurs Grossiste A.",
      enabled: true,
    },
    {
      key: "commerce_conversation_governance_enabled",
      description:
        "Instruction 20.60 — gouvernance conversationnelle commerce-first (modes prix fixe, négociation, partenaires).",
      enabled: true,
    },
    {
      key: "commercial_trust_layer_enabled",
      description:
        "Instruction 20.3 — couche confiance économique privée (heuristique, non marketplace, non sociale).",
      enabled: true,
    },
    {
      key: "commercial_trust_realtime_enabled",
      description: "Fan-out signaux commercial.trust.* vers gateway (20.3, payload minimal).",
      enabled: true,
    },
    {
      key: "corridor_intelligence_layer_enabled",
      description:
        "Instruction 20.4 — intelligence corridor privée (gouvernance relationnelle, non marketplace, non ranking public).",
      enabled: true,
    },
    {
      key: "corridor_intelligence_realtime_enabled",
      description: "Fan-out événements commercial.corridor.* vers gateway (20.4, payload minimal whitelist + Zod).",
      enabled: true,
    },
    {
      key: "relational_negotiation_draft_v1",
      description:
        "Instruction 20.1 — conversational order draft + heuristic negotiation extraction in private commerce threads (no auto-order).",
      enabled: true,
    },
    {
      key: "relational_negotiation_draft_realtime_enabled",
      description: "Fan-out draft / negotiation / reservation events to commerce-realtime gateway (20.1)",
      enabled: true,
    },
    {
      key: "sponsored_commercial_discovery_v1",
      description:
        "Instruction 20.2 — découverte sponsorisée contrôlée, fenêtre temporaire, handshake vers relation (pas marketplace).",
      enabled: true,
    },
    {
      key: "sponsored_discovery_realtime_enabled",
      description: "Fan-out événements sponsored discovery vers commerce-realtime gateway (20.2)",
      enabled: true,
    },
    {
      key: "backoffice_auth_enabled",
      description: "Instruction BACKOFFICE-01 — connexion back-office email + OTP interne.",
      enabled: true,
    },
    {
      key: "backoffice_error_observability_enabled",
      description: "Instruction BACKOFFICE-01 — observabilité erreurs utilisateur vers back-office.",
      enabled: true,
    },
    {
      key: "backoffice_journey_monitoring_enabled",
      description: "Instruction BACKOFFICE-01 — monitoring parcours A→B.",
      enabled: true,
    },
    {
      key: "backoffice_support_desk_enabled",
      description: "Instruction BACKOFFICE-01 — bureau assistance interne léger.",
      enabled: true,
    },
    {
      key: "backoffice_platform_health_enabled",
      description: "Instruction BACKOFFICE-01 — santé plateforme back-office.",
      enabled: true,
    },
    {
      key: "backoffice_product_quality_enabled",
      description: "Instruction BACKOFFICE-01 — centre qualité produit.",
      enabled: true,
    },
    {
      key: "backoffice_live_persistence_enabled",
      description: "Instruction BACKOFFICE-01-A — persistance Prisma réelle back-office.",
      enabled: true,
    },
    {
      key: "backoffice_live_governance_enabled",
      description: "Instruction BACKOFFICE-01-A — gouvernance grands comptes live.",
      enabled: true,
    },
    {
      key: "backoffice_operational_health_enabled",
      description: "Instruction BACKOFFICE-01-A — health checks opérationnels.",
      enabled: true,
    },
  ];

  for (const f of flags) {
    await prisma.featureFlag.upsert({
      where: {
        key_scopeType_scopeValue: {
          key: f.key,
          scopeType: FeatureFlagScopeType.GLOBAL,
          scopeValue: "",
        },
      },
      create: {
        ...f,
        scopeType: FeatureFlagScopeType.GLOBAL,
        scopeValue: "",
      },
      update: { enabled: f.enabled, description: f.description },
    });
  }

  await prisma.wallet.upsert({
    where: {
      organizationId_currency: { organizationId: I.oProd, currency: "XOF" },
    },
    create: {
      id: I.wProd,
      organizationId: I.oProd,
      currency: "XOF",
      balance: d(12500000),
      status: WalletStatus.ACTIVE,
      qrPayload: `VENEXT-WALLET:${I.oProd}:XOF`,
      nfcEnabled: true,
    },
    update: {},
  });

  await prisma.wallet.upsert({
    where: {
      organizationId_currency: { organizationId: I.oWA, currency: "XOF" },
    },
    create: {
      id: I.wWA,
      organizationId: I.oWA,
      currency: "XOF",
      balance: d(4200000),
      status: WalletStatus.ACTIVE,
      qrPayload: `VENEXT-WALLET:${I.oWA}:XOF`,
      nfcEnabled: false,
    },
    update: {},
  });

  await prisma.wallet.upsert({
    where: {
      organizationId_currency: { organizationId: I.oWB1, currency: "XOF" },
    },
    create: {
      id: I.wWB1,
      organizationId: I.oWB1,
      currency: "XOF",
      balance: d(890000),
      status: WalletStatus.LIMITED,
      qrPayload: `venext://qr/v2/demo-wb1`,
      nfcEnabled: false,
    },
    update: { status: WalletStatus.LIMITED },
  });

  await prisma.transaction.upsert({
    where: { id: "f1111111-1111-1111-1111-111111111001" },
    create: {
      id: "f1111111-1111-1111-1111-111111111001",
      walletId: I.wWA,
      organizationId: I.oWA,
      type: TransactionType.PAYMENT,
      amount: d(250000),
      currency: "XOF",
      status: TransactionStatus.POSTED,
      provider: "demo_ledger",
      reference: "txn-seed-001",
    },
    update: {},
  });

  await prisma.transaction.upsert({
    where: { id: "f1111111-1111-4111-8111-111111111011" },
    create: {
      id: "f1111111-1111-4111-8111-111111111011",
      walletId: I.wWB1,
      organizationId: I.oWB1,
      type: TransactionType.PAYMENT,
      amount: d(50000),
      currency: "XOF",
      status: TransactionStatus.FAILED,
      provider: "mock_payment_provider",
      reference: "demo-fail-001",
      nonce: "seed-nonce-fail-01",
      payloadSignature: "",
      metadata: {
        auditTrail: [{ at: new Date().toISOString(), step: "provider_failed", result: { ok: false } }],
      },
    },
    update: {},
  });

  await prisma.transaction.upsert({
    where: { id: "f1111111-1111-4111-8111-111111111012" },
    create: {
      id: "f1111111-1111-4111-8111-111111111012",
      walletId: I.wWB1,
      organizationId: I.oWB1,
      type: TransactionType.CREDIT,
      amount: d(120000),
      currency: "XOF",
      status: TransactionStatus.SUCCESS,
      provider: "mock_payment_provider",
      reference: "demo-delayed-ok",
      nonce: "seed-nonce-delay-01",
      payloadSignature: "",
      metadata: {
        auditTrail: [
          { at: new Date().toISOString(), step: "initiated" },
          { at: new Date().toISOString(), step: "processing", delayMs: 1800 },
          { at: new Date().toISOString(), step: "success" },
        ],
      },
    },
    update: {},
  });

  await prisma.industrialPoleConfig.upsert({
    where: {
      organizationId_pole: {
        organizationId: I.oProd,
        pole: OrgMemberPole.INDUSTRIAL_SAFETY,
      },
    },
    create: {
      organizationId: I.oProd,
      pole: OrgMemberPole.INDUSTRIAL_SAFETY,
      enabled: true,
      dashboardConfig: { widgets: ["throughput", "alerts"] },
      alertPreferences: { sms: false, email: true },
    },
    update: {},
  });

  // --- Instruction 6: product economic states, traceability, recalls, group buying, sponsored injections ---
  const ecoUpsert = async (
    id: string,
    productId: string,
    temp: CommercialTemperature,
    tension: number,
    movement: number,
  ) => {
    await prisma.productEconomicState.upsert({
      where: { productId },
      create: {
        id,
        productId,
        activeDiscussionCount: temp === CommercialTemperature.HOT ? 5 : temp === CommercialTemperature.CRITICAL ? 8 : 2,
        negotiationCount: temp === CommercialTemperature.HOT ? 2 : 1,
        recentOrderCount: temp === CommercialTemperature.CRITICAL ? 6 : 3,
        demandVelocity: temp === CommercialTemperature.HOT ? 0.82 : 0.45,
        stockTensionLevel: tension,
        visibilityScore: 0.7 + tension * 0.15,
        sponsoredScore: productId === I.pSponsor ? 0.72 : 0.08,
        trustScore: 0.85,
        freshnessScore: 0.68,
        movementIntensity: movement,
        activeRetailerInterest: 0.55 + movement * 0.2,
        commercialTemperature: temp,
      },
      update: {
        stockTensionLevel: tension,
        movementIntensity: movement,
        commercialTemperature: temp,
        sponsoredScore: productId === I.pSponsor ? 0.72 : 0.08,
      },
    });
  };

  await ecoUpsert(I.ecoRaw, I.pRaw, CommercialTemperature.HOT, 0.64, 0.74);
  await ecoUpsert(I.ecoPack, I.pWAPack, CommercialTemperature.ACTIVE, 0.48, 0.52);
  await ecoUpsert(I.ecoSponsor, I.pSponsor, CommercialTemperature.CRITICAL, 0.88, 0.91);

  await prisma.productTraceability.upsert({
    where: { productId: I.pRaw },
    create: {
      id: I.trRaw,
      productId: I.pRaw,
      lotNumber: "LOT-SN-2025-RAW-01",
      barcode: "3661234567890",
      productionDate: new Date("2025-01-10"),
      expirationDate: new Date("2026-06-30"),
      traceabilityEnabled: true,
      recallEligible: true,
    },
    update: {},
  });
  await prisma.productTraceability.upsert({
    where: { productId: I.pWAPack },
    create: {
      id: I.trPack,
      productId: I.pWAPack,
      lotNumber: "LOT-WA-PACK-14",
      traceabilityEnabled: true,
      recallEligible: true,
    },
    update: {},
  });
  await prisma.productTraceability.upsert({
    where: { productId: I.pSponsor },
    create: {
      id: I.trSponsor,
      productId: I.pSponsor,
      traceabilityEnabled: false,
      recallEligible: true,
    },
    update: {},
  });

  await prisma.recallEvent.upsert({
    where: { id: I.recall1 },
    create: {
      id: I.recall1,
      productId: I.pRaw,
      lotNumber: "LOT-SN-2024-LEGACY",
      severity: RecallSeverity.LOW,
      affectedZones: ["SN-THIES"],
      recallReason: "Contrôle qualité interne — lot historique, surveillance renforcée (démo).",
    },
    update: {},
  });

  await prisma.groupBuyingSession.upsert({
    where: { id: I.gb1 },
    create: {
      id: I.gb1,
      initiatorOrganizationId: I.oR1,
      productId: I.pWAPack,
      relationshipId: I.rWAR1,
      targetQuantity: d(500),
      currentQuantity: d(210),
      participantCount: 4,
      expiresAt: new Date(Date.now() + 5 * 86_400_000),
      status: GroupBuyingStatus.OPEN,
    },
    update: {},
  });

  await prisma.sponsoredProductInjection.upsert({
    where: { id: I.inj1 },
    create: {
      id: I.inj1,
      productId: I.pSponsor,
      sponsorOrganizationId: I.oWB1,
      targetCommercialCategory: "boissons",
      relationshipId: I.rWB1R2,
      maxRelationshipDepth: 2,
      relevanceFloor: 0.35,
      active: true,
      governanceState: { status: "ACTIVE", actor: "seed", at: new Date().toISOString() },
    },
    update: {
      governanceState: { status: "ACTIVE", actor: "seed", at: new Date().toISOString() },
    },
  });

  await prisma.sponsoredCommercialCampaign.upsert({
    where: { id: I.sCamp1 },
    create: {
      id: I.sCamp1,
      sponsorOrganizationId: I.oWB1,
      productId: I.pSponsor,
      active: true,
      regionScope: "SN",
      cityScope: null,
      districtScope: null,
      targetActorCategory: OrganizationCategory.RETAILER,
      sponsorBudgetSnapshot: { symbolicWeeklyCapXof: 500000, note: "seed_intelligence_placement" },
      maxActiveWindowsPerTarget: 3,
      cooldownSeconds: 120,
      windowDurationHours: 168,
      discoverySource: "INTELLIGENCE_PLACEMENT",
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000 * 120),
    },
    update: {
      active: true,
      endsAt: new Date(Date.now() + 86400000 * 120),
    },
  });

  await prisma.organization.update({
    where: { id: I.oWB2 },
    data: { governanceSuspended: true },
  });

  await prisma.backofficeAuditLog.createMany({
    data: [
      {
        actor: "seed_operator",
        action: "feature_flag_upsert",
        target: "nfc_enabled",
        source: "governance",
        metadata: { note: "Instruction 10 demo audit" },
      },
      {
        actor: "seed_operator",
        action: "organization_governance_patch",
        target: I.oWB2,
        source: "governance",
        metadata: { governanceSuspended: true, reason: "Demo governance suspension" },
      },
      {
        actor: "seed_operator",
        action: "ai_gateway_governance_patch",
        target: "ai_gateway",
        source: "governance",
        metadata: { mockLatencyMs: 120 },
      },
    ],
  });

  console.log("VENEXT seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
