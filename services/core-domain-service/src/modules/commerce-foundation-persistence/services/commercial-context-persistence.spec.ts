import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CommerceFoundationRepository } from "../commerce-foundation.repository";
import { CommercialContextPersistenceService } from "./commercial-context-persistence.service";

function createRepoMock(): CommerceFoundationRepository {
  const store = new Map<string, unknown>();
  return {
    list: vi.fn(),
    getByKey: vi.fn(async (_type, key) => {
      const payload = store.get(key);
      if (!payload) return null;
      return {
        id: "id-1",
        entityType: "CommercialContextState",
        entityKey: key,
        organizationId: null,
        relationshipId: null,
        actorRole: null,
        payload,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
    upsert: vi.fn(async (_type, key, payload) => {
      store.set(key, payload);
      return {
        id: "id-1",
        entityType: "CommercialContextState",
        entityKey: key,
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
    count: vi.fn(),
  } as unknown as CommerceFoundationRepository;
}

describe("CommercialContextPersistenceService (20.79-A)", () => {
  let service: CommercialContextPersistenceService;

  beforeEach(() => {
    service = new CommercialContextPersistenceService(createRepoMock());
  });

  it("trimHistory keeps last 5", () => {
    const history = Array.from({ length: 8 }, (_, i) => ({ step: i }));
    expect(service.trimHistory(history)).toHaveLength(5);
    expect((service.trimHistory(history)[0] as { step: number }).step).toBe(3);
  });

  it("saveContext stores workspace and sub tab", async () => {
    const saved = await service.saveContext("org-1", {
      lastWorkspace: "orders",
      lastSubTab: "in_progress",
      activeContext: { orderId: "o1" },
    });
    expect(saved.lastWorkspace).toBe("orders");
    expect((saved.activeContext as { orderId: string }).orderId).toBe("o1");
  });
});
