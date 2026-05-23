/**
 * Instruction 20.25 — macro-economic resilience engines (deterministic, bounded).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { RelationalMacroEconomicDependencyService } from "./relational-macro-economic-dependency.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";
import { RelationalMacroEconomicPropagationService } from "./relational-macro-economic-propagation.service";
import { RelationalMacroEconomicResilienceService } from "./relational-macro-economic-resilience.service";
import type { MacroEconomicCorridorContext } from "./relational-macro-economic-corridor-context.service";

const baseCtx: MacroEconomicCorridorContext = {
  relationshipId: "00000000-0000-4000-8000-000000000001",
  hasOrder: true,
  buyerOrganizationId: "00000000-0000-4000-8000-0000000000b1",
  sellerOrganizationId: "00000000-0000-4000-8000-0000000000b2",
  territoryCountry: "SN",
  territoryCity: "DK",
  sectorNodeId: null,
  sectorSlug: null,
  geoZoneId: null,
  economicDependencyNodeId: null,
  primarySupplyFlowNodeId: null,
  pressureScore: 44,
  fragilityScore: 33,
  geoFragilityScore: 20,
  sectorOperationalRisk: 40,
  sectorFragility: 35,
  supplyFlowDisruptionAvg: 30,
  supplyFlowNodesUsed: 2,
  sectorNodesUsed: 1,
  openIncidentCount: 0,
  coordinationOpenCount: 0,
  blockingTaskCount: 0,
  predictiveUnresolvedCount: 1,
  predictiveUnresolvedAvgScore: 50,
  strategicMemoryActiveCount: 1,
  strategicMemoryAvgConfidence: 60,
  operationalMetricStress: 12,
  operationalMetricsUsed: 3,
  commandCenterStress: 25,
  peerPressureEdgeCount: 2,
  orchestrationOpenCount: 0,
  simulationOpenCount: 0,
  scenarioReviewOpenCount: 0,
  heuristicFallbackUsed: false,
  fallbackReasons: [],
};

describe("RelationalMacroEconomicPolicyService", () => {
  const policy = new RelationalMacroEconomicPolicyService();

  it("assertMacroEconomicMutationAllowed blocks TERMINATED and SUSPENDED", () => {
    expect(policy.assertMacroEconomicMutationAllowed(CommercialCorridorState.TERMINATED).allowed).toBe(false);
    expect(policy.assertMacroEconomicMutationAllowed(CommercialCorridorState.SUSPENDED).allowed).toBe(false);
    expect(policy.assertMacroEconomicMutationAllowed(CommercialCorridorState.ACTIVE).allowed).toBe(true);
    const t = policy.assertMacroEconomicMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(t.diagnostics.corridorTerminated).toBe(true);
    expect(t.diagnostics.mutationSkippedReason).toBe("corridor_terminated");
  });

  it("VENEXT_MACRO_ECONOMIC_MAX_DEPTH clamps propagation depth", () => {
    const prev = process.env.VENEXT_MACRO_ECONOMIC_MAX_DEPTH;
    process.env.VENEXT_MACRO_ECONOMIC_MAX_DEPTH = "2";
    expect(new RelationalMacroEconomicPolicyService().maxPropagationDepth()).toBe(2);
    if (prev === undefined) delete process.env.VENEXT_MACRO_ECONOMIC_MAX_DEPTH;
    else process.env.VENEXT_MACRO_ECONOMIC_MAX_DEPTH = prev;
  });
});

describe("RelationalMacroEconomicResilienceService", () => {
  it("computes bounded resilience scores with diagnostics", () => {
    const resilience = new RelationalMacroEconomicResilienceService(new RelationalMacroEconomicPolicyService());
    const low = resilience.computeResilience(baseCtx);
    const high = resilience.computeResilience({ ...baseCtx, openIncidentCount: 5, pressureScore: 88 });
    expect(high.economicStress).toBeGreaterThan(low.economicStress);
    expect(high.resilienceScore).toBeLessThanOrEqual(100);
    expect(low.diagnostics).toHaveProperty("computedFrom");
  });
});

describe("RelationalMacroEconomicDependencyService", () => {
  it("varies dependency strength with incident pressure", () => {
    const resilience = new RelationalMacroEconomicResilienceService(new RelationalMacroEconomicPolicyService());
    const scores = resilience.computeResilience(baseCtx);
    const a = RelationalMacroEconomicDependencyService.computeCorridorDependency({
      relationshipId: baseCtx.relationshipId,
      resilience: scores,
      ctx: baseCtx,
    });
    const b = RelationalMacroEconomicDependencyService.computeCorridorDependency({
      relationshipId: baseCtx.relationshipId,
      resilience: scores,
      ctx: { ...baseCtx, openIncidentCount: 4 },
    });
    expect(b.dependencyStrength).toBeGreaterThan(a.dependencyStrength);
  });
});

describe("RelationalMacroEconomicPropagationService", () => {
  it("DFS respects VENEXT_MACRO_ECONOMIC_MAX_DEPTH", async () => {
    const prev = process.env.VENEXT_MACRO_ECONOMIC_MAX_DEPTH;
    process.env.VENEXT_MACRO_ECONOMIC_MAX_DEPTH = "1";
    const policy = new RelationalMacroEconomicPolicyService();
    const a = "00000000-0000-4000-8000-000000000001";
    const b = "00000000-0000-4000-8000-000000000002";
    const prisma = {
      relationalMacroEconomicDependency: {
        findMany: vi.fn().mockResolvedValue([
          { sourceMacroNodeId: a, targetMacroNodeId: b, collapseTransferScore: 40 },
        ]),
      },
    } as never;
    const svc = new RelationalMacroEconomicPropagationService(prisma, policy);
    const r = await svc.buildPropagationMap("00000000-0000-4000-8000-00000000abcd");
    if (prev === undefined) delete process.env.VENEXT_MACRO_ECONOMIC_MAX_DEPTH;
    else process.env.VENEXT_MACRO_ECONOMIC_MAX_DEPTH = prev;
    expect(r.maxDepthObserved).toBeLessThanOrEqual(1);
    expect(r.traversalDiagnostics).toHaveProperty("collapseExposure");
  });
});
