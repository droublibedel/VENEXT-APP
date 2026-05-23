import { beforeEach, describe, expect, it, vi } from "vitest";

import { commerceFoundationUxError } from "./commerce-foundation.errors";
import type { CommerceFoundationRepository } from "./commerce-foundation.repository";
import { createCommerceFoundationService } from "./commerce-foundation-test-factory";
import type { CommerceFoundationService } from "./commerce-foundation.service";
import { buildCommerceFoundationDemoSeed } from "./demo/commerce-foundation-demo.seed";
import { CommercialContextPersistenceService } from "./services/commercial-context-persistence.service";

function createRepoMock(): CommerceFoundationRepository {
  const store = new Map<string, { entityType: string; entityKey: string; payload: unknown }>();
  return {
    list: vi.fn(async (entityType, filter = {}) => {
      const rows = [...store.values()].filter((r) => r.entityType === entityType);
      if (filter.organizationId) {
        return rows.filter((r) => (r as { organizationId?: string }).organizationId === filter.organizationId);
      }
      return rows.slice(0, filter.limit ?? 50).map((r, i) => ({
        id: `id-${i}`,
        entityType: r.entityType,
        entityKey: r.entityKey,
        organizationId: (r as { organizationId?: string }).organizationId ?? null,
        relationshipId: null,
        actorRole: null,
        payload: r.payload,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }),
    getByKey: vi.fn(async (entityType, entityKey) => {
      const row = store.get(`${entityType}:${entityKey}`);
      if (!row) return null;
      return {
        id: "id-1",
        entityType,
        entityKey,
        organizationId: null,
        relationshipId: null,
        actorRole: null,
        payload: row.payload,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    upsert: vi.fn(async (entityType, entityKey, payload) => {
      store.set(`${entityType}:${entityKey}`, { entityType, entityKey, payload });
      return {
        id: "id-1",
        entityType,
        entityKey,
        organizationId: null,
        relationshipId: null,
        actorRole: null,
        payload,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    softDelete: vi.fn(),
    count: vi.fn(async (entityType) => [...store.values()].filter((r) => r.entityType === entityType).length),
  } as unknown as CommerceFoundationRepository;
}

describe("commerce-foundation-persistence (20.79)", () => {
  let repo: CommerceFoundationRepository;
  let service: CommerceFoundationService;

  beforeEach(() => {
    repo = createRepoMock();
    service = createCommerceFoundationService(repo);
  });

  it("demo seed builds coherent story entities", () => {
    const seed = buildCommerceFoundationDemoSeed();
    expect(seed.length).toBeGreaterThan(15);
    expect(seed.some((r) => r.entityType === "ActorProfile" && r.actorRole === "PRODUCER")).toBe(true);
    expect(seed.some((r) => r.entityKey === "rel-grossiste-b-detaillant-yop")).toBe(true);
    expect(seed.some((r) => r.entityType === "WalletDemoState")).toBe(true);
  });

  it("seedDemoIfEmpty inserts when empty", async () => {
    const r = await service.seedDemoIfEmpty();
    expect(r.inserted).toBeGreaterThan(10);
    const again = await service.seedDemoIfEmpty();
    expect(again.inserted).toBe(0);
  });

  it("ux errors are human and not technical", () => {
    expect(commerceFoundationUxError("catalogUnavailable")).not.toMatch(/404|unauthorized/i);
    expect(commerceFoundationUxError("settlementNotAllowed")).toMatch(/autorisé/i);
  });

  it("assertCatalogAccess blocks wrong relationship", () => {
    expect(() =>
      service.assertCatalogAccess("rel-a", "org-b", "rel-other"),
    ).toThrow(/Catalogue/);
  });

  it("assertOrderAccess blocks outsider org", () => {
    expect(() =>
      service.assertOrderAccess({ buyerActorId: "a", sellerActorId: "b" }, "outsider"),
    ).toThrow(/accessible/);
  });

  it("list returns payloads", async () => {
    await service.upsert("ActorProfile", "p1", { id: "p1", displayName: "Test" });
    const rows = await service.list<{ id: string }>("ActorProfile");
    expect(rows[0]?.id).toBe("p1");
  });

  it("getByKey returns null when missing", async () => {
    expect(await service.getByKey("CommercialOrder", "missing")).toBeNull();
  });

  it("upsert roundtrip", async () => {
    const saved = await service.upsert("CommercialOrder", "o1", { id: "o1", status: "draft" });
    expect(saved.status).toBe("draft");
  });

  it("no global marketplace in seed catalogs", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const catalogs = seed.filter((r) => r.entityType === "RelationalCatalog");
    expect(catalogs.every((c) => (c.payload as { visibilityMode: string }).visibilityMode === "relationship_only")).toBe(
      true,
    );
  });

  it("wallet demo flagged", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const wallet = seed.find((r) => r.entityType === "WalletDemoState");
    expect((wallet?.payload as { walletDemoMode: boolean }).walletDemoMode).toBe(true);
  });

  it("relationship formal vs terrain", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const rels = seed.filter((r) => r.entityType === "CommercialRelationship");
    expect(rels.some((r) => (r.payload as { relationshipLevel: string }).relationshipLevel === "formal")).toBe(true);
    expect(rels.some((r) => (r.payload as { relationshipLevel: string }).relationshipLevel === "terrain")).toBe(true);
  });

  it("orders linked to relationship", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const order = seed.find((r) => r.entityType === "CommercialOrder");
    expect(order?.relationshipId).toBe("rel-grossiste-b-detaillant-yop");
  });

  it("settlements use wallet demo mode", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const stl = seed.find((r) => r.entityType === "CommercialSettlement");
    expect((stl?.payload as { walletDemoMode: boolean }).walletDemoMode).toBe(true);
  });

  it("messaging terrain mode", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const thread = seed.find((r) => r.entityType === "CommerceMessageThread");
    expect((thread?.payload as { mode: string }).mode).toBe("terrain");
  });

  it("professional mail for formal corridor", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const mail = seed.find((r) => r.entityType === "ProfessionalMailThread");
    expect(mail?.relationshipId).toBe("rel-producer-grossiste-a");
  });

  it("feature flags include persistence keys", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const keys = seed
      .filter((r) => r.entityType === "FeatureFlagState")
      .map((r) => (r.payload as { key: string }).key);
    expect(keys).toContain("venext_backend_persistence_enabled");
    expect(keys).toContain("venext_bff_routes_enabled");
  });

  it("assertCatalogAccess passes for matching relationship", () => {
    expect(() => service.assertCatalogAccess("rel-a", "org-x", "rel-a")).not.toThrow();
  });

  it("assertOrderAccess passes for buyer", () => {
    expect(() =>
      service.assertOrderAccess({ buyerActorId: "org-a", sellerActorId: "org-b" }, "org-a"),
    ).not.toThrow();
  });

  it("assertOrderAccess passes for seller", () => {
    expect(() =>
      service.assertOrderAccess({ buyerActorId: "org-a", sellerActorId: "org-b" }, "org-b"),
    ).not.toThrow();
  });

  it("demo includes delivery for order corridor", () => {
    const seed = buildCommerceFoundationDemoSeed();
    const delivery = seed.find((r) => r.entityType === "CommercialDelivery");
    expect((delivery?.payload as { corridor: string }).corridor).toBeTruthy();
  });

  it("demo includes aminata detaillant profile", () => {
    const seed = buildCommerceFoundationDemoSeed();
    expect(seed.some((r) => r.entityKey === "profile-detaillant-aminata")).toBe(true);
  });

  it("demo includes grossiste A formal relationship", () => {
    const seed = buildCommerceFoundationDemoSeed();
    expect(seed.some((r) => r.entityKey === "rel-producer-grossiste-a")).toBe(true);
  });

  it("no seed entity type is MarketplaceCatalog", () => {
    const seed = buildCommerceFoundationDemoSeed();
    expect(seed.every((r) => r.entityType !== "MarketplaceCatalog")).toBe(true);
  });

  it("context states seeded per actor", () => {
    const seed = buildCommerceFoundationDemoSeed();
    expect(seed.filter((r) => r.entityType === "CommercialContextState").length).toBeGreaterThan(0);
  });

  it("context history trimmed to max 5 entries", async () => {
    const ctxService = new CommercialContextPersistenceService(repo);
    for (let i = 0; i < 8; i += 1) {
      await ctxService.saveContext("org-test", {
        navigationEntry: { module: `m${i}`, at: new Date().toISOString() },
      });
    }
    const saved = await ctxService.getContext("org-test");
    expect(Array.isArray(saved?.history)).toBe(true);
    expect((saved?.history as unknown[]).length).toBeLessThanOrEqual(5);
  });
});
