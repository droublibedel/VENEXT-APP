import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { OrganizationCategory, RelationshipStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { CatalogVisibilityEngineService } from "./catalog-visibility/catalog-visibility-engine.service";
import { ContactGraphAnalyzerService } from "./relational-commerce/contact-graph-analyzer.service";
import { SponsoredInjectionEngineService } from "./relational-commerce/sponsored-injection-engine.service";
import { WholesalerDualCatalogService } from "./relational-commerce/wholesaler-dual-catalog.service";

describe("Instruction 9A — catalog gate", () => {
  it("denies BLOCKED relationships", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "rid",
          status: RelationshipStatus.BLOCKED,
          upstreamOrganizationId: "a0000000-0000-0000-0000-000000000001",
          downstreamOrganizationId: "b0000000-0000-0000-0000-000000000002",
        }),
      },
    };
    const svc = new CatalogVisibilityEngineService(prisma as never);
    await expect(svc.assertRelationshipAcceptedForCatalog("rid")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("denies SUSPENDED relationships", async () => {
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          id: "rid",
          status: RelationshipStatus.SUSPENDED,
          upstreamOrganizationId: "a0000000-0000-0000-0000-000000000001",
          downstreamOrganizationId: "b0000000-0000-0000-0000-000000000002",
        }),
      },
    };
    const svc = new CatalogVisibilityEngineService(prisma as never);
    await expect(svc.assertRelationshipAcceptedForCatalog("rid")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows ACCEPTED relationships", async () => {
    const row = {
      id: "rid",
      status: RelationshipStatus.ACCEPTED,
      upstreamOrganizationId: "a0000000-0000-0000-0000-000000000001",
      downstreamOrganizationId: "b0000000-0000-0000-0000-000000000002",
    };
    const prisma = { relationship: { findUnique: vi.fn().mockResolvedValue(row) } };
    const svc = new CatalogVisibilityEngineService(prisma as never);
    await expect(svc.assertRelationshipAcceptedForCatalog("rid")).resolves.toEqual(row);
  });

  it("denies viewer not party to edge", async () => {
    const row = {
      id: "rid",
      status: RelationshipStatus.ACCEPTED,
      upstreamOrganizationId: "a0000000-0000-0000-0000-000000000001",
      downstreamOrganizationId: "b0000000-0000-0000-0000-000000000002",
    };
    const prisma = { relationship: { findUnique: vi.fn().mockResolvedValue(row) } };
    const svc = new CatalogVisibilityEngineService(prisma as never);
    await expect(
      svc.assertRelationshipAcceptedForCatalog("rid", "c0000000-0000-0000-0000-000000000099"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("throws NotFound when relationship missing", async () => {
    const prisma = { relationship: { findUnique: vi.fn().mockResolvedValue(null) } };
    const svc = new CatalogVisibilityEngineService(prisma as never);
    await expect(svc.assertRelationshipAcceptedForCatalog("missing")).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("Instruction 9A — mutual contact scoping", () => {
  it("only inspects phones present on the requesting user", async () => {
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([{ normalizedPhone: "+2211" }])
      .mockResolvedValueOnce([
        {
          normalizedPhone: "+2211",
          user: { id: "u1", fullName: "A", phoneNumber: "+2211" },
        },
        {
          normalizedPhone: "+2211",
          user: { id: "u2", fullName: "B", phoneNumber: "+2212" },
        },
      ]);
    const prisma = { userContactSnapshot: { findMany } };
    const svc = new ContactGraphAnalyzerService(prisma as never);
    const out = await svc.mutualContactClustersForUser("u1", 2);
    expect(findMany).toHaveBeenCalledTimes(2);
    expect(findMany.mock.calls[0]![0]).toMatchObject({ where: { userId: "u1" } });
    expect(out).toHaveLength(1);
    expect(out[0]!.users.map((u) => u.id).sort()).toEqual(["u1", "u2"]);
  });
});

describe("Instruction 9A — sponsored flag", () => {
  it("returns empty when sponsored_products_enabled is false", async () => {
    const flags = { isEnabled: vi.fn().mockResolvedValue(false) };
    const prisma = { sponsoredProductInjection: { findMany: vi.fn() } };
    const graph = { shortestPathHops: vi.fn() };
    const relevance = { resolve: vi.fn() };
    const svc = new SponsoredInjectionEngineService(prisma as never, flags as never, graph as never, relevance as never);
    const out = await svc.listActiveInjections({ viewerOrganizationId: "org", viewerCategory: "x" });
    expect(out.items).toEqual([]);
    expect(prisma.sponsoredProductInjection.findMany).not.toHaveBeenCalled();
  });
});

describe("Instruction 9A — wholesaler dual catalog", () => {
  it("returns empty upstream for non-wholesaler categories", async () => {
    const prisma = {
      organization: {
        findUnique: vi.fn().mockResolvedValue({
          id: "ret",
          displayName: "R",
          category: OrganizationCategory.RETAILER,
        }),
      },
    };
    const intelligence = { livingCatalog: vi.fn() };
    const svc = new WholesalerDualCatalogService(prisma as never, intelligence as never);
    const out = await svc.dualCatalog("ret");
    expect(out.notice).toBe("dual_catalog_only_for_wholesaler_categories");
    expect(out.upstreamFeeds).toHaveLength(0);
    expect(intelligence.livingCatalog).not.toHaveBeenCalled();
  });
});
