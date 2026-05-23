import { describe, expect, it, vi } from "vitest";

import { createCommerceFoundationService } from "./commerce-foundation-test-factory";
import type { CommerceFoundationRepository } from "./commerce-foundation.repository";
import { CommerceFoundationEnvelopeMappers } from "./commerce-foundation-envelope.mappers";
import { RelationalCatalogPersistenceService } from "./services/relational-catalog-persistence.service";
import { CommercialRelationshipPersistenceService } from "./services/commercial-relationship-persistence.service";

function createRepoMock(): CommerceFoundationRepository {
  const store = new Map<string, { entityType: string; entityKey: string; payload: unknown; organizationId?: string; relationshipId?: string }>();
  return {
    list: vi.fn(async (entityType, filter = {}) => {
      const rows = [...store.values()].filter((r) => r.entityType === entityType);
      const filtered = filter.organizationId
        ? rows.filter((r) => r.organizationId === filter.organizationId)
        : rows;
      return filtered.map((r, i) => ({
        id: `id-${i}`,
        entityType: r.entityType,
        entityKey: r.entityKey,
        organizationId: r.organizationId ?? null,
        relationshipId: r.relationshipId ?? null,
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
        organizationId: row.organizationId ?? null,
        relationshipId: row.relationshipId ?? null,
        actorRole: null,
        payload: row.payload,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    upsert: vi.fn(async (entityType, entityKey, payload, meta = {}) => {
      store.set(`${entityType}:${entityKey}`, {
        entityType,
        entityKey,
        payload,
        organizationId: meta.organizationId,
        relationshipId: meta.relationshipId,
      });
      return {
        id: "id-1",
        entityType,
        entityKey,
        organizationId: meta.organizationId ?? null,
        relationshipId: meta.relationshipId ?? null,
        actorRole: null,
        payload,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    softDelete: vi.fn(async (entityType, entityKey) => {
      store.delete(`${entityType}:${entityKey}`);
    }),
    count: vi.fn(async (entityType) => [...store.values()].filter((r) => r.entityType === entityType).length),
  } as unknown as CommerceFoundationRepository;
}

describe("commerce-foundation 20.79-A", () => {
  it("facade exposes split persistence services", () => {
    const repo = createRepoMock();
    const facade = createCommerceFoundationService(repo);
    expect(facade.actors).toBeInstanceOf(Object);
    expect(facade.catalogs).toBeInstanceOf(RelationalCatalogPersistenceService);
    expect(facade.relationships).toBeInstanceOf(CommercialRelationshipPersistenceService);
  });

  it("catalog visibility blocks wrong relationship", () => {
    const repo = createRepoMock();
    const catalogs = new RelationalCatalogPersistenceService(repo);
    expect(() => catalogs.assertCatalogAccess("rel-a", "org", "rel-b")).toThrow();
  });

  it("relationship list filters by organization", async () => {
    const repo = createRepoMock();
    const rels = new CommercialRelationshipPersistenceService(repo);
    await rels.saveRelationship("rel-1", {
      id: "rel-1",
      actorAId: "org-a",
      actorBId: "org-b",
      relationshipType: "supply",
    });
    const rows = await rels.listForOrganization("org-a");
    expect(rows).toHaveLength(1);
  });

  it("producer mapper returns relationship-only catalog", async () => {
    const repo = createRepoMock();
    const facade = createCommerceFoundationService(repo);
    await repo.upsert(
      "RelationalCatalog",
      "cat-1",
      {
        id: "cat-1",
        visibilityMode: "relationship_only",
        relationshipId: "rel-1",
        products: [{ id: "p1" }],
        ownerActorId: "org-producer-agronexus-ci",
        partnerActorId: "org-grossiste-a-nord-plus",
      },
      { organizationId: "org-producer-agronexus-ci", relationshipId: "rel-1" },
    );
    const mappers = new CommerceFoundationEnvelopeMappers(facade);
    const env = await mappers.mapProducer("catalog", "org-producer-agronexus-ci");
    expect(env.payload.products).toHaveLength(1);
  });

  it("grossiste-a mapper returns orders envelope", async () => {
    const repo = createRepoMock();
    const facade = createCommerceFoundationService(repo);
    await repo.upsert(
      "CommercialOrder",
      "ord-1",
      {
        id: "ord-1",
        buyerActorId: "org-grossiste-a-nord-plus",
        sellerActorId: "org-producer-agronexus-ci",
        status: "pending",
        lines: [],
        totalAmount: 1000,
        updatedAt: new Date().toISOString(),
      },
      { organizationId: "org-grossiste-a-nord-plus" },
    );
    const mappers = new CommerceFoundationEnvelopeMappers(facade);
    const env = await mappers.mapGrossisteA("orders", "org-grossiste-a-nord-plus");
    expect((env.payload as { enCours: unknown[] }).enCours.length).toBeGreaterThan(0);
  });

  it("resetDemo soft-deletes records", async () => {
    const repo = createRepoMock();
    const facade = createCommerceFoundationService(repo);
    await facade.upsert("ActorProfile", "p1", { id: "p1" });
    const r = await facade.resetDemo();
    expect(r.deleted).toBeGreaterThan(0);
  });
});
