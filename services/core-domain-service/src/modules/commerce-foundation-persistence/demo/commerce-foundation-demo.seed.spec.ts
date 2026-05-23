import { describe, expect, it } from "vitest";

import {
  DEMO_ORG_DETAILLANT_YOP,
  DEMO_ORG_GROSSISTE_B,
  DEMO_ORG_PRODUCER,
  DEMO_REL_BC,
  buildCommerceFoundationDemoSeed,
} from "./commerce-foundation-demo.seed";

describe("commerce-foundation demo seed (20.79)", () => {
  const seed = buildCommerceFoundationDemoSeed();

  it("includes AgroNexus producer", () => {
    const p = seed.find((r) => r.entityKey === "profile-producer");
    expect((p?.payload as { displayName: string }).displayName).toContain("AgroNexus");
    expect(p?.organizationId).toBe(DEMO_ORG_PRODUCER);
  });

  it("includes grossiste B François", () => {
    const p = seed.find((r) => r.entityKey === "profile-grossiste-b");
    expect((p?.payload as { displayName: string }).displayName).toMatch(/François|Mode/i);
  });

  it("includes Yopougon detaillant", () => {
    const p = seed.find((r) => r.entityKey === "profile-detaillant-yop");
    expect(p?.organizationId).toBe(DEMO_ORG_DETAILLANT_YOP);
  });

  it("has terrain relationship grossiste B ↔ Yopougon", () => {
    const rel = seed.find((r) => r.entityKey === DEMO_REL_BC);
    expect(rel?.entityType).toBe("CommercialRelationship");
    expect((rel?.payload as { relationshipLevel: string }).relationshipLevel).toBe("terrain");
  });

  it("has no public marketplace catalog", () => {
    const catalogs = seed.filter((r) => r.entityType === "RelationalCatalog");
    expect(catalogs.length).toBeGreaterThan(0);
    expect(
      catalogs.every((c) => (c.payload as { visibilityMode: string }).visibilityMode === "relationship_only"),
    ).toBe(true);
  });

  it("order links conversation", () => {
    const order = seed.find((r) => r.entityType === "CommercialOrder");
    expect((order?.payload as { linkedConversationId?: string }).linkedConversationId).toBeTruthy();
  });

  it("settlement is demo only", () => {
    const stl = seed.find((r) => r.entityType === "CommercialSettlement");
    expect((stl?.payload as { walletDemoMode: boolean }).walletDemoMode).toBe(true);
    expect((stl?.payload as { method: string }).method).toMatch(/demo|cash|mobile/i);
  });

  it("wallet persisted for grossiste B", () => {
    const w = seed.find((r) => r.entityType === "WalletDemoState");
    expect(w?.entityKey).toBe(DEMO_ORG_GROSSISTE_B);
  });

  it("persistence feature flags seeded", () => {
    const keys = seed
      .filter((r) => r.entityType === "FeatureFlagState")
      .map((r) => (r.payload as { key: string }).key);
    expect(keys).toContain("venext_backend_persistence_enabled");
    expect(keys).toContain("venext_live_data_fallback_enabled");
  });
});
