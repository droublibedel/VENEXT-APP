import { UnauthorizedException } from "@nestjs/common";
import { CommercialTrustDataConfidence, CommercialTrustSignalType, RelationshipStatus } from "@prisma/client";
import { CommercialTrustProfileSchema } from "@venext/shared-contracts";
import { describe, expect, it, vi } from "vitest";

import { isAcceptedCommercialRelationshipForOrg } from "./accepted-commercial-relationship.helper";
import { CommercialTrustComputationService } from "./commercial-trust-computation.service";
import { InternalCommercialTrustController } from "./internal-commercial-trust.controller";

describe("Instruction 20.3 — internal commercial trust recompute", () => {
  it("rejects missing or wrong internal key", async () => {
    const prev = process.env.VENEXT_INTERNAL_REALTIME_KEY;
    process.env.VENEXT_INTERNAL_REALTIME_KEY = "secret-trust";
    const ctrl = new InternalCommercialTrustController({ computeAndPersist: vi.fn() } as never);
    const org = "00000000-0000-4000-8000-000000000001";
    await expect(ctrl.recompute(undefined, org)).rejects.toThrow(UnauthorizedException);
    await expect(ctrl.recompute("wrong", org)).rejects.toThrow(UnauthorizedException);
    process.env.VENEXT_INTERNAL_REALTIME_KEY = prev;
  });

  it("recompute-orders-impact accepts valid internal key", async () => {
    const prev = process.env.VENEXT_INTERNAL_REALTIME_KEY;
    process.env.VENEXT_INTERNAL_REALTIME_KEY = "secret-trust";
    const compute = vi.fn().mockResolvedValue(undefined);
    const ctrl = new InternalCommercialTrustController({ computeAndPersist: compute } as never);
    const org = "00000000-0000-4000-8000-000000000002";
    const out = await ctrl.recomputeOrdersImpact("secret-trust", org);
    expect(out.ok).toBe(true);
    expect(out.mode).toBe("ORDERS_IMPACT_RECOMPUTE");
    expect(compute).toHaveBeenCalledWith(org);
    process.env.VENEXT_INTERNAL_REALTIME_KEY = prev;
  });
});

describe("Instruction 20.3 — diagnostics envelope", () => {
  it("buildDiagnostics carries heuristic honesty flags and visibility scope", () => {
    const svc = new CommercialTrustComputationService({} as never, {} as never);
    const d = svc.buildDiagnostics({
      negotiationCount: 2,
      acceptedRelationshipCount: 1,
      dataConfidenceLevel: CommercialTrustDataConfidence.MEDIUM,
      signals: [
        { signalType: CommercialTrustSignalType.NEGOTIATION_STABILITY, confidenceLevel: CommercialTrustDataConfidence.LOW },
      ],
      lastComputedAt: new Date("2026-01-01T00:00:00.000Z"),
      visibilityScope: "SELF_PRIVATE",
    });
    expect(d.heuristicOnly).toBe(true);
    expect(d.publicMarketplaceExposure).toBe(false);
    expect(d.publicRankingDisabled).toBe(true);
    expect(d.socialScoringDisabled).toBe(true);
    expect(d.privateEconomicTrustLayer).toBe(true);
    expect(d.visibilityScope).toBe("SELF_PRIVATE");
    expect(d.computationSource).toBe("COMMERCIAL_TRUST_V1_HEURISTIC");
    expect(d.incrementalReady).toBe(true);
    expect(d.actorRequired).toBe(true);
    expect(d.anonymousAccessAllowed).toBe(false);
    expect(d.visibilityEnforcedAt).toBe("GUARD_AND_SERVICE");
  });
});

describe("Instruction 20.3A — accepted relationship helper", () => {
  it("counts org as participant on upstream/downstream ACCEPTED", () => {
    const ok = isAcceptedCommercialRelationshipForOrg("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", {
      status: RelationshipStatus.ACCEPTED,
      upstreamOrganizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      downstreamOrganizationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      requesterOrganizationId: null,
      receiverOrganizationId: null,
    });
    expect(ok).toBe(true);
  });

  it("counts org on requester/receiver ACCEPTED without upstream", () => {
    const ok = isAcceptedCommercialRelationshipForOrg("cccccccc-cccc-4ccc-8ccc-cccccccccccc", {
      status: RelationshipStatus.ACCEPTED,
      upstreamOrganizationId: null,
      downstreamOrganizationId: null,
      requesterOrganizationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      receiverOrganizationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    });
    expect(ok).toBe(true);
  });

  it("does not double-interpret a row: single predicate per relationship id (integration left to Prisma count)", () => {
    const ok = isAcceptedCommercialRelationshipForOrg("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", {
      status: RelationshipStatus.PENDING,
      upstreamOrganizationId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      downstreamOrganizationId: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      requesterOrganizationId: null,
      receiverOrganizationId: null,
    });
    expect(ok).toBe(false);
  });
});

describe("Instruction 20.3A — Zod profile contract", () => {
  it("rejects trustScore outside 0..100", () => {
    const parsed = CommercialTrustProfileSchema.safeParse({
      organizationId: "00000000-0000-4000-8000-000000000001",
      trustLevel: "UNKNOWN",
      trustScore: 101,
      relationshipCount: 0,
      acceptedRelationshipCount: 0,
      negotiationCompletionRate: 0,
      averageNegotiationResponseMinutes: null,
      sponsoredConversationConversionRate: 0,
      dormantRelationshipRatio: 0,
      unresolvedNegotiationRatio: 0,
      symbolicReservationReliability: 0,
      deliveryConsistencySignal: 0,
      commercialStabilitySignal: 0,
      dataConfidenceLevel: "LOW",
      lastComputedAt: null,
      heuristicOnly: true,
    });
    expect(parsed.success).toBe(false);
  });
});
