export const DEMO_ORG_PRODUCER = "org-producer-agronexus-ci";
export const DEMO_ORG_GROSSISTE_A = "org-grossiste-a-nord-plus";
export const DEMO_ORG_GROSSISTE_B = "org-grossiste-b-demo";
export const DEMO_ORG_DETAILLANT_YOP = "org-detaillant-yopougon";
export const DEMO_ORG_DETAILLANT_AMINATA = "org-detaillant-aminata";
export const DEMO_REL_AB = "rel-producer-grossiste-a";
export const DEMO_REL_BC = "rel-grossiste-b-detaillant-yop";

const now = () => new Date().toISOString();

export function buildCommerceFoundationDemoSeed(): {
  entityType: string;
  entityKey: string;
  organizationId?: string;
  relationshipId?: string;
  actorRole?: string;
  payload: unknown;
}[] {
  const profiles = [
    {
      id: "profile-producer",
      actorRole: "PRODUCER",
      displayName: "AgroNexus CI",
      phone: "+2250700100100",
      email: "contact@agronexus.ci",
      city: "Abidjan",
      activities: ["Agroalimentaire", "Distribution"],
      businessName: "AgroNexus CI",
      formalCompany: "AgroNexus SARL",
      onboardingCompleted: true,
      locale: "fr-CI",
      organizationId: DEMO_ORG_PRODUCER,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "profile-grossiste-a",
      actorRole: "GROSSISTE_A",
      displayName: "Distribution Nord Plus",
      phone: "+2250700200200",
      city: "Bouaké",
      activities: ["Grossiste", "Logistique légère"],
      businessName: "Distribution Nord Plus",
      formalCompany: "DNP SA",
      onboardingCompleted: true,
      locale: "fr-CI",
      organizationId: DEMO_ORG_GROSSISTE_A,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "profile-grossiste-b",
      actorRole: "GROSSISTE_B",
      displayName: "François — La Rue de la Mode",
      phone: "+2250707111222",
      city: "Abidjan",
      activities: ["Textile", "Mode terrain"],
      businessName: "La Rue de la Mode",
      onboardingCompleted: true,
      locale: "fr-CI",
      organizationId: DEMO_ORG_GROSSISTE_B,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "profile-detaillant-yop",
      actorRole: "DETAILLANT",
      displayName: "Boutique Yopougon",
      phone: "+2250505050505",
      city: "Yopougon",
      activities: ["Détail", "Alimentaire"],
      businessName: "Client Yopougon",
      onboardingCompleted: true,
      locale: "fr-CI",
      organizationId: DEMO_ORG_DETAILLANT_YOP,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: "profile-detaillant-aminata",
      actorRole: "DETAILLANT",
      displayName: "Aminata Commerce",
      phone: "+2250708080808",
      city: "Cocody",
      activities: ["Cosmétique", "Détail"],
      businessName: "Aminata",
      onboardingCompleted: true,
      locale: "fr-CI",
      organizationId: DEMO_ORG_DETAILLANT_AMINATA,
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const relationships = [
    {
      id: DEMO_REL_AB,
      actorAId: DEMO_ORG_PRODUCER,
      actorBId: DEMO_ORG_GROSSISTE_A,
      relationshipType: "producer_wholesaler",
      relationshipLevel: "formal",
      governanceMode: "STRICT_PRIVATE",
      identityMode: "formal",
      status: "active",
      autoAcceptMode: "manual",
      visibilityMode: "relationship_only",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: DEMO_REL_BC,
      actorAId: DEMO_ORG_GROSSISTE_B,
      actorBId: DEMO_ORG_DETAILLANT_YOP,
      relationshipType: "wholesaler_retail",
      relationshipLevel: "terrain",
      governanceMode: "TERRAIN_TRUST",
      identityMode: "contact_first",
      status: "active",
      autoAcceptMode: "auto",
      visibilityMode: "relationship_only",
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const catalogs = [
    {
      id: "catalog-bc-yop",
      ownerActorId: DEMO_ORG_GROSSISTE_B,
      partnerActorId: DEMO_ORG_DETAILLANT_YOP,
      visibilityMode: "relationship_only",
      relationshipId: DEMO_REL_BC,
      products: [
        {
          id: "p-riz-25",
          name: "Riz 25kg",
          category: "Alimentaire",
          priceLabel: "12 500 FCFA",
        },
        {
          id: "p-huile-5",
          name: "Huile 5L",
          category: "Alimentaire",
          priceLabel: "8 900 FCFA",
        },
      ],
      sponsored: false,
      status: "active",
      updatedAt: now(),
    },
  ];

  const orders = [
    {
      id: "order-bc-001",
      relationshipId: DEMO_REL_BC,
      buyerActorId: DEMO_ORG_DETAILLANT_YOP,
      sellerActorId: DEMO_ORG_GROSSISTE_B,
      catalogId: "catalog-bc-yop",
      status: "in_delivery",
      lines: [{ sku: "p-riz-25", qty: 10, label: "Riz 25kg" }],
      totalAmount: 125000,
      settlementStatus: "pending",
      deliveryStatus: "in_transit",
      linkedConversationId: "thread-bc-001",
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const deliveries = [
    {
      id: "delivery-bc-001",
      orderId: "order-bc-001",
      relationshipId: DEMO_REL_BC,
      status: "in_transit",
      originCity: "Marcory",
      destinationCity: "Yopougon",
      corridor: "Abidjan intra-muros",
      confirmations: [{ step: "loaded", at: now(), by: "François" }],
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const settlements = [
    {
      id: "settlement-bc-001",
      orderId: "order-bc-001",
      relationshipId: DEMO_REL_BC,
      payerActorId: DEMO_ORG_DETAILLANT_YOP,
      receiverActorId: DEMO_ORG_GROSSISTE_B,
      method: "mobile-money",
      amount: 125000,
      currency: "XOF",
      status: "awaiting_confirmation",
      walletDemoMode: true,
      confirmationStatus: "pending",
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const messages = [
    {
      id: "thread-bc-001",
      relationshipId: DEMO_REL_BC,
      orderId: "order-bc-001",
      participants: [DEMO_ORG_GROSSISTE_B, DEMO_ORG_DETAILLANT_YOP],
      mode: "terrain",
      messages: [
        {
          id: "m1",
          from: DEMO_ORG_GROSSISTE_B,
          text: "Camion parti — tu confirmes réception ce soir ?",
          at: now(),
        },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const mails = [
    {
      id: "mail-ab-001",
      relationshipId: DEMO_REL_AB,
      subject: "Commande riz premium — semaine 20",
      participants: [DEMO_ORG_PRODUCER, DEMO_ORG_GROSSISTE_A],
      attachmentsMeta: [{ name: "bon-commande.pdf", sizeKb: 120 }],
      messages: [
        {
          id: "mail-m1",
          from: DEMO_ORG_PRODUCER,
          subject: "Commande riz premium — semaine 20",
          body: "Bonjour, voici les quantités confirmées pour Bouaké.",
          at: now(),
        },
      ],
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  const contexts = [
    {
      id: "ctx-grossiste-b",
      actorId: DEMO_ORG_GROSSISTE_B,
      activeContext: { module: "orders", orderId: "order-bc-001" },
      history: [{ module: "catalog", at: now() }],
      lastWorkspace: "wallet",
      updatedAt: now(),
    },
  ];

  const flags = [
    {
      key: "venext_backend_persistence_enabled",
      enabled: true,
      environment: "development",
      updatedAt: now(),
    },
    {
      key: "venext_bff_routes_enabled",
      enabled: true,
      environment: "development",
      updatedAt: now(),
    },
    {
      key: "venext_live_data_fallback_enabled",
      enabled: true,
      environment: "development",
      updatedAt: now(),
    },
    {
      key: "grossiste_b_live_data_enabled",
      enabled: true,
      environment: "development",
      actorRole: "GROSSISTE_B",
      updatedAt: now(),
    },
  ];

  const walletDemo = {
    organizationId: DEMO_ORG_GROSSISTE_B,
    balanceFcfa: 850,
    availableLabel: "850 FCFA",
    walletActivated: true,
    walletDemoMode: true,
    securityMode: "LIGHT_COMMERCE_MODE",
    transactions: [
      {
        id: "tx-demo-1",
        label: "Encaissement mobile money (démo)",
        amountLabel: "+ 45 000 FCFA",
        status: "confirmed",
      },
    ],
    kycDemoCompleted: false,
    pinConfigured: false,
  };

  const records: {
    entityType: string;
    entityKey: string;
    organizationId?: string;
    relationshipId?: string;
    actorRole?: string;
    payload: unknown;
  }[] = [];

  for (const p of profiles) {
    records.push({
      entityType: "ActorProfile",
      entityKey: p.id,
      organizationId: p.organizationId,
      actorRole: p.actorRole,
      payload: p,
    });
  }
  for (const r of relationships) {
    records.push({
      entityType: "CommercialRelationship",
      entityKey: r.id,
      relationshipId: r.id,
      payload: r,
    });
  }
  for (const c of catalogs) {
    records.push({
      entityType: "RelationalCatalog",
      entityKey: c.id,
      organizationId: c.ownerActorId,
      relationshipId: c.relationshipId,
      payload: c,
    });
  }
  for (const o of orders) {
    records.push({
      entityType: "CommercialOrder",
      entityKey: o.id,
      relationshipId: o.relationshipId,
      organizationId: o.sellerActorId,
      payload: o,
    });
  }
  for (const d of deliveries) {
    records.push({
      entityType: "CommercialDelivery",
      entityKey: d.id,
      relationshipId: d.relationshipId,
      payload: d,
    });
  }
  for (const s of settlements) {
    records.push({
      entityType: "CommercialSettlement",
      entityKey: s.id,
      relationshipId: s.relationshipId,
      payload: s,
    });
  }
  for (const m of messages) {
    records.push({
      entityType: "CommerceMessageThread",
      entityKey: m.id,
      relationshipId: m.relationshipId,
      payload: m,
    });
  }
  for (const mail of mails) {
    records.push({
      entityType: "ProfessionalMailThread",
      entityKey: mail.id,
      relationshipId: mail.relationshipId,
      payload: mail,
    });
  }
  for (const ctx of contexts) {
    records.push({
      entityType: "CommercialContextState",
      entityKey: ctx.id,
      organizationId: ctx.actorId,
      payload: ctx,
    });
  }
  for (const f of flags) {
    records.push({
      entityType: "FeatureFlagState",
      entityKey: f.key,
      payload: f,
    });
  }
  records.push({
    entityType: "WalletDemoState",
    entityKey: DEMO_ORG_GROSSISTE_B,
    organizationId: DEMO_ORG_GROSSISTE_B,
    payload: walletDemo,
  });

  return records;
}
