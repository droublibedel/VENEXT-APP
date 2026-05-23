import { describe, expect, it, vi } from "vitest";
import {
  CatalogVisibilityMode,
  RelationshipStatus,
} from "@prisma/client";
import { CatalogVisibilityResolverService } from "./catalog-visibility-resolver.service";

function mockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    catalog: {
      findUnique: vi.fn(),
    },
    relationship: {
      findFirst: vi.fn(),
    },
    ...overrides,
  };
}

describe("CatalogVisibilityResolverService", () => {
  it("denies viewing another org catalog without accepted relationship", async () => {
    const prisma = mockPrisma();
    prisma.catalog.findUnique.mockResolvedValue({
      active: true,
      organizationId: "owner-org",
      visibilityMode: CatalogVisibilityMode.RELATIONSHIP_ONLY,
      organization: { id: "owner-org" },
    });
    prisma.relationship.findFirst.mockResolvedValue(null);

    const svc = new CatalogVisibilityResolverService(prisma as never);
    const r = await svc.canViewCatalog("viewer-org", "cat-1");

    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("no_accepted_relationship");
  });

  it("allows viewing peer catalog when an accepted relationship exists", async () => {
    const prisma = mockPrisma();
    prisma.catalog.findUnique.mockResolvedValue({
      active: true,
      organizationId: "owner-org",
      visibilityMode: CatalogVisibilityMode.RELATIONSHIP_ONLY,
      organization: { id: "owner-org" },
    });
    prisma.relationship.findFirst.mockResolvedValue({
      id: "rel-1",
      status: RelationshipStatus.ACCEPTED,
    });

    const svc = new CatalogVisibilityResolverService(prisma as never);
    const r = await svc.canViewCatalog("viewer-org", "cat-1");

    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("accepted_relationship");
    expect(r.relationshipId).toBe("rel-1");
  });

  it("allows owner to view own catalog", async () => {
    const prisma = mockPrisma();
    prisma.catalog.findUnique.mockResolvedValue({
      active: true,
      organizationId: "same-org",
      visibilityMode: CatalogVisibilityMode.RELATIONSHIP_ONLY,
      organization: { id: "same-org" },
    });

    const svc = new CatalogVisibilityResolverService(prisma as never);
    const r = await svc.canViewCatalog("same-org", "cat-1");

    expect(r.allowed).toBe(true);
    expect(r.reason).toBe("catalog_owner");
  });
});
