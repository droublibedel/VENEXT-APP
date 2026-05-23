import { describe, expect, it } from "vitest";

import {
  ActorProfileContractSchema,
  CommercialDeliveryContractSchema,
  CommercialOrderContractSchema,
  CommercialRelationshipContractSchema,
  CommercialSettlementContractSchema,
  CommerceDataEnvelopeSchema,
  CommerceMessageContractSchema,
  FeatureFlagContractSchema,
  ProfessionalMailContractSchema,
  RelationalCatalogContractSchema,
  WalletDemoStateContractSchema,
} from "./schemas.js";

const baseProfile = {
  id: "p1",
  actorRole: "GROSSISTE_B",
  displayName: "Test",
  onboardingCompleted: true,
  locale: "fr-CI",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("commerce-foundation contracts (20.79)", () => {
  it("parses actor profile", () => {
    expect(ActorProfileContractSchema.parse(baseProfile).displayName).toBe("Test");
  });

  it("rejects profile without displayName", () => {
    expect(() => ActorProfileContractSchema.parse({ ...baseProfile, displayName: undefined })).toThrow();
  });

  it("parses commercial relationship", () => {
    const rel = CommercialRelationshipContractSchema.parse({
      id: "rel-1",
      actorAId: "a",
      actorBId: "b",
      relationshipType: "supply",
      relationshipLevel: "terrain",
      governanceMode: "contact_first",
      identityMode: "pseudo",
      status: "active",
      autoAcceptMode: "manual",
      visibilityMode: "relationship_only",
      createdAt: baseProfile.createdAt,
      updatedAt: baseProfile.updatedAt,
    });
    expect(rel.visibilityMode).toBe("relationship_only");
  });

  it("parses relational catalog with products array", () => {
    const cat = RelationalCatalogContractSchema.parse({
      id: "cat-1",
      ownerActorId: "o",
      partnerActorId: "p",
      visibilityMode: "relationship_only",
      relationshipId: "rel-1",
      products: [{ id: "sku-1", name: "Riz" }],
      sponsored: false,
      status: "active",
      updatedAt: baseProfile.updatedAt,
    });
    expect(cat.products).toHaveLength(1);
  });

  it("parses commercial order", () => {
    const order = CommercialOrderContractSchema.parse({
      id: "ord-1",
      relationshipId: "rel-1",
      buyerActorId: "b",
      sellerActorId: "s",
      status: "pending",
      lines: [],
      totalAmount: 12000,
      settlementStatus: "pending",
      deliveryStatus: "pending",
      createdAt: baseProfile.createdAt,
      updatedAt: baseProfile.updatedAt,
    });
    expect(order.totalAmount).toBe(12000);
  });

  it("parses delivery", () => {
    const d = CommercialDeliveryContractSchema.parse({
      id: "del-1",
      orderId: "ord-1",
      relationshipId: "rel-1",
      status: "in_transit",
      originCity: "Abidjan",
      destinationCity: "Yopougon",
      corridor: "abidjan-yop",
      confirmations: [],
      createdAt: baseProfile.createdAt,
      updatedAt: baseProfile.updatedAt,
    });
    expect(d.corridor).toContain("yop");
  });

  it("parses settlement with wallet demo", () => {
    const s = CommercialSettlementContractSchema.parse({
      id: "stl-1",
      relationshipId: "rel-1",
      payerActorId: "b",
      receiverActorId: "s",
      method: "mobile_money_demo",
      amount: 45000,
      currency: "XOF",
      status: "pending",
      walletDemoMode: true,
      confirmationStatus: "pending",
      createdAt: baseProfile.createdAt,
      updatedAt: baseProfile.updatedAt,
    });
    expect(s.walletDemoMode).toBe(true);
  });

  it("parses message thread", () => {
    const t = CommerceMessageContractSchema.parse({
      id: "thr-1",
      relationshipId: "rel-1",
      participants: ["a", "b"],
      mode: "terrain",
      messages: [],
      createdAt: baseProfile.createdAt,
      updatedAt: baseProfile.updatedAt,
    });
    expect(t.mode).toBe("terrain");
  });

  it("parses professional mail", () => {
    const m = ProfessionalMailContractSchema.parse({
      id: "mail-1",
      relationshipId: "rel-1",
      subject: "Commande formelle",
      participants: ["a@x.ci", "b@y.ci"],
      attachmentsMeta: [],
      messages: [],
      createdAt: baseProfile.createdAt,
      updatedAt: baseProfile.updatedAt,
    });
    expect(m.subject.length).toBeGreaterThan(0);
  });

  it("parses feature flag", () => {
    const f = FeatureFlagContractSchema.parse({
      key: "venext_bff_routes_enabled",
      enabled: true,
      environment: "development",
      updatedAt: baseProfile.updatedAt,
    });
    expect(f.key).toContain("bff");
  });

  it("parses wallet demo state", () => {
    const w = WalletDemoStateContractSchema.parse({
      organizationId: "org-1",
      balanceFcfa: 850,
      availableLabel: "850 FCFA",
      walletActivated: true,
      walletDemoMode: true,
      securityMode: "LIGHT_COMMERCE_MODE",
      transactions: [],
    });
    expect(w.walletDemoMode).toBe(true);
  });

  it("parses data envelope", () => {
    const env = CommerceDataEnvelopeSchema.parse({
      dataSource: "live",
      fallbackUsed: false,
      payload: { ok: true },
    });
    expect(env.dataSource).toBe("live");
  });
});
