import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDetaillantOrganizationId,
  buildDetaillantProfileId,
  DetaillantRegistrationService,
} from "./detaillant-registration.service";
import type { CommerceFoundationRepository } from "./commerce-foundation.repository";
import { createCommerceFoundationService } from "./commerce-foundation-test-factory";
import type { CommerceFoundationService } from "./commerce-foundation.service";

function createRepoMock(): CommerceFoundationRepository {
  const store = new Map<string, { entityType: string; entityKey: string; payload: unknown; organizationId?: string; actorRole?: string }>();
  return {
    list: vi.fn(async (entityType, filter = {}) => {
      const rows = [...store.values()].filter((r) => r.entityType === entityType);
      if (filter.organizationId) {
        return rows
          .filter((r) => r.organizationId === filter.organizationId)
          .slice(0, filter.limit ?? 50)
          .map((r, i) => ({
            id: `id-${i}`,
            entityType: r.entityType,
            entityKey: r.entityKey,
            organizationId: r.organizationId ?? null,
            relationshipId: null,
            actorRole: r.actorRole ?? null,
            payload: r.payload,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
      }
      return rows.slice(0, filter.limit ?? 50).map((r, i) => ({
        id: `id-${i}`,
        entityType: r.entityType,
        entityKey: r.entityKey,
        organizationId: r.organizationId ?? null,
        relationshipId: null,
        actorRole: r.actorRole ?? null,
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
        relationshipId: null,
        actorRole: row.actorRole ?? null,
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
        actorRole: meta.actorRole,
      });
      return {
        id: "id-1",
        entityType,
        entityKey,
        organizationId: meta.organizationId ?? null,
        relationshipId: null,
        actorRole: meta.actorRole ?? null,
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

describe("detaillant registration", () => {
  let foundation: CommerceFoundationService;
  let service: DetaillantRegistrationService;

  beforeEach(() => {
    const repo = createRepoMock();
    foundation = createCommerceFoundationService(repo);
    service = new DetaillantRegistrationService(foundation);
  });

  it("derives stable organization ids from phone", () => {
    expect(buildDetaillantOrganizationId("2250701020304")).toBe("org-detaillant-0701020304");
    expect(buildDetaillantProfileId("2250701020304")).toBe("profile-detaillant-0701020304");
  });

  it("persists actor profile and wallet demo state", async () => {
    const result = await service.register({
      phone: "0701020304",
      displayName: "Aminata",
      activities: ["Boissons"],
      city: "Abidjan",
    });

    expect(result.organizationId).toBe("org-detaillant-0701020304");
    expect(result.profile.displayName).toBe("Aminata");
    expect(result.profile.onboardingCompleted).toBe(true);

    const wallet = await foundation.getByKey("WalletDemoState", result.organizationId);
    expect(wallet).toBeTruthy();
  });
});
