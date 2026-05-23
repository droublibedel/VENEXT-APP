import { ForbiddenException } from "@nestjs/common";
import { FeatureFlagScopeType, RelationshipStatus } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanonicalFeatureFlagEvaluator } from "../feature-flags/canonical-feature-flag.evaluator";
import { OrganizationAccessService } from "../platform-authz/organization-access.service";
import { RelationshipAccessService } from "../platform-authz/relationship-access.service";
import { RelationalCommerceNetworkTraverserService } from "./relational-commerce/relational-commerce-network-traverser.service";
import { SponsoredInjectionEngineService } from "./relational-commerce/sponsored-injection-engine.service";

describe("Instruction 9B — AuthZ services", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("denies org access when user is not an active member", async () => {
    const prisma = {
      organizationMember: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const svc = new OrganizationAccessService(prisma as never);
    await expect(
      svc.assertMemberOrBypass({ userId: "u1", organizationId: "o-h" }, "org-target"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("DEV_AUTH_BYPASS skips membership lookup", async () => {
    vi.stubEnv("DEV_AUTH_BYPASS", "true");
    const findFirst = vi.fn();
    const prisma = { organizationMember: { findFirst } };
    const svc = new OrganizationAccessService(prisma as never);
    await svc.assertMemberOrBypass({ userId: "u1", organizationId: "o-h" }, "org-target");
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("denies relationship access when acting org is not a participant", async () => {
    vi.stubEnv("DEV_AUTH_BYPASS", "false");
    vi.stubEnv("NODE_ENV", "production");
    const prisma = {
      relationship: {
        findUnique: vi.fn().mockResolvedValue({
          upstreamOrganizationId: "a0000000-0000-0000-0000-0000000000a1",
          downstreamOrganizationId: "b0000000-0000-0000-0000-0000000000b2",
        }),
      },
    };
    const svc = new RelationshipAccessService(prisma as never);
    await expect(
      svc.assertParticipantOrgOrBypass(
        { userId: "u1", organizationId: "c0000000-0000-0000-0000-0000000000c3" },
        "rel-1",
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe("Instruction 9B — canonical feature flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("evaluates global flag", async () => {
    const prisma = {
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          { key: "k", scopeType: FeatureFlagScopeType.GLOBAL, scopeValue: "", enabled: true },
        ]),
      },
    };
    const ev = new CanonicalFeatureFlagEvaluator(prisma as never);
    const r = await ev.evaluate("k", {});
    expect(r.enabled).toBe(true);
    expect(r.source).toBe("GLOBAL");
  });

  it("evaluates organization-scoped flag", async () => {
    const orgId = "o0000000-0000-0000-0000-000000000001";
    const prisma = {
      featureFlag: {
        findMany: vi.fn().mockResolvedValue([
          { key: "k", scopeType: FeatureFlagScopeType.GLOBAL, scopeValue: "", enabled: false },
          { key: "k", scopeType: FeatureFlagScopeType.ORGANIZATION, scopeValue: orgId, enabled: true },
        ]),
      },
    };
    const ev = new CanonicalFeatureFlagEvaluator(prisma as never);
    const r = await ev.evaluate("k", { organizationId: orgId });
    expect(r.enabled).toBe(true);
    expect(r.source).toBe("ORGANIZATION");
  });

  it("unknown key is disabled (production-safe)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const prisma = { featureFlag: { findMany: vi.fn().mockResolvedValue([]) } };
    const ev = new CanonicalFeatureFlagEvaluator(prisma as never);
    const r = await ev.evaluate("no_such_flag_9b", {});
    expect(r.enabled).toBe(false);
    expect(r.source).toBe("UNKNOWN");
  });
});

describe("Instruction 9B — sponsored canonical engine", () => {
  it("denies sponsored feed when feature flag is off", async () => {
    const flags = { isEnabled: vi.fn().mockResolvedValue(false) };
    const prisma = { sponsoredProductInjection: { findMany: vi.fn() } };
    const graph = { shortestPathHops: vi.fn() };
    const relevance = { resolve: vi.fn() };
    const svc = new SponsoredInjectionEngineService(prisma as never, flags as never, graph as never, relevance as never);
    const out = await svc.listActiveInjections({ viewerOrganizationId: "org", projection: "summary" });
    expect(out.items).toEqual([]);
    expect(prisma.sponsoredProductInjection.findMany).not.toHaveBeenCalled();
  });

  it("filters incompatible category and preserves sponsor identity when a row matches", async () => {
    const flags = { isEnabled: vi.fn().mockResolvedValue(true) };
    const sponsor = {
      id: "spon-1",
      displayName: "S",
      commercialId: "C-1",
      category: "WHOLESALE",
      city: "Dakar",
      country: "SN",
    };
    const rows = [
      {
        id: "inj-bad",
        targetCommercialCategory: "RETAIL",
        sponsorOrganizationId: "s-org",
        relevanceFloor: 0,
        maxRelationshipDepth: 3,
        relationshipId: null,
        productId: "p1",
        product: {
          id: "p1",
          name: "P",
          category: "x",
          imageUrls: [],
          basePrice: 1,
          currency: "XOF",
          organizationId: "p-org",
        },
        sponsor,
        sponsorCity: null,
        sponsorCountry: null,
      },
      {
        id: "inj-good",
        targetCommercialCategory: "WHOLESALE",
        sponsorOrganizationId: "s-org",
        relevanceFloor: 0,
        maxRelationshipDepth: 3,
        relationshipId: null,
        productId: "p2",
        product: {
          id: "p2",
          name: "P2",
          category: "y",
          imageUrls: [],
          basePrice: 2,
          currency: "XOF",
          organizationId: "p-org",
        },
        sponsor,
        sponsorCity: null,
        sponsorCountry: null,
      },
    ];
    const prisma = {
      sponsoredProductInjection: { findMany: vi.fn().mockResolvedValue(rows) },
      organization: { findUnique: vi.fn().mockResolvedValue({ category: "WHOLESALE", activityLabel: null, city: "Dakar", country: "SN", commune: null }) },
    };
    const graph = { shortestPathHops: vi.fn().mockResolvedValue(1) };
    const relevance = { resolve: vi.fn().mockResolvedValue({ relevanceScore: 1 }) };
    const svc = new SponsoredInjectionEngineService(prisma as never, flags as never, graph as never, relevance as never);
    const out = await svc.listActiveInjections({
      viewerOrganizationId: "v-org",
      viewerCategory: "WHOLESALE",
      projection: "standard",
    });
    expect(out.items).toHaveLength(1);
    expect(out.items[0]!.injectionId).toBe("inj-good");
    expect(out.items[0]!.sponsor.id).toBe("spon-1");
  });

  it("summary projection omits heavy product fields", async () => {
    const flags = { isEnabled: vi.fn().mockResolvedValue(true) };
    const sponsor = {
      id: "spon-1",
      displayName: "S",
      commercialId: "C-1",
      category: "WHOLESALE",
      city: "Dakar",
      country: "SN",
    };
    const rows = [
      {
        id: "inj-1",
        targetCommercialCategory: "WHOLESALE",
        sponsorOrganizationId: "s-org",
        relevanceFloor: 0,
        maxRelationshipDepth: 3,
        relationshipId: null,
        productId: "p2",
        product: {
          id: "p2",
          name: "P2",
          category: "y",
          imageUrls: ["https://example.com/x.png"],
          basePrice: 2,
          currency: "XOF",
          organizationId: "p-org",
        },
        sponsor,
        sponsorCity: null,
        sponsorCountry: null,
      },
    ];
    const prisma = {
      sponsoredProductInjection: { findMany: vi.fn().mockResolvedValue(rows) },
      organization: {
        findUnique: vi.fn().mockResolvedValue({
          category: "WHOLESALE",
          activityLabel: null,
          city: "Dakar",
          country: "SN",
          commune: null,
        }),
      },
    };
    const graph = { shortestPathHops: vi.fn().mockResolvedValue(1) };
    const relevance = { resolve: vi.fn().mockResolvedValue({ relevanceScore: 1 }) };
    const svc = new SponsoredInjectionEngineService(prisma as never, flags as never, graph as never, relevance as never);
    const out = await svc.listActiveInjections({
      viewerOrganizationId: "v-org",
      viewerCategory: "WHOLESALE",
      projection: "summary",
    });
    expect(out.items).toHaveLength(1);
    expect(out.items[0]!.product).not.toHaveProperty("imageUrls");
    expect(out.items[0]!.product).not.toHaveProperty("basePrice");
  });
});

describe("Instruction 9B — graph traversal metadata", () => {
  it("returns traversal metadata and batches neighbor load", async () => {
    const relsL0 = [
      {
        id: "r1",
        upstreamOrganizationId: "start",
        downstreamOrganizationId: "n1",
        trustLevel: 1,
        status: RelationshipStatus.ACCEPTED,
      },
    ];
    const relsL1 = [
      {
        id: "r2",
        upstreamOrganizationId: "n1",
        downstreamOrganizationId: "n2",
        trustLevel: 1,
        status: RelationshipStatus.ACCEPTED,
      },
    ];
    const findMany = vi.fn().mockResolvedValueOnce(relsL0).mockResolvedValueOnce(relsL1).mockResolvedValue([]);
    const prisma = { relationship: { findMany } };
    const svc = new RelationalCommerceNetworkTraverserService(prisma as never);
    const out = await svc.traverseNetwork("start", 2, 500);
    expect(out.truncated).toBe(false);
    expect(out.exploredEdges).toBeGreaterThan(0);
    expect(out.visitedNodes).toContain("start");
    expect(out.visitedNodes).toContain("n1");
    expect(findMany).toHaveBeenCalled();
    expect(findMany.mock.calls[0]![0].where.OR).toBeDefined();
  });
});
