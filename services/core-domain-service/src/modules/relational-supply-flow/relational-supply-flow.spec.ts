/**
 * Instruction 20.24 — supply flow intelligence engines (deterministic, bounded).
 */
import { CommercialCorridorState } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { RelationalSupplyFlowDependencyService } from "./relational-supply-flow-dependency.service";
import { RelationalSupplyFlowPolicyService } from "./relational-supply-flow-policy.service";
import { RelationalSupplyFlowPropagationService } from "./relational-supply-flow-propagation.service";

describe("RelationalSupplyFlowPolicyService", () => {
  const policy = new RelationalSupplyFlowPolicyService();

  it("canMutateSupplyFlowState forbids TERMINATED", () => {
    expect(policy.canMutateSupplyFlowState(CommercialCorridorState.TERMINATED)).toBe(false);
    expect(policy.canMutateSupplyFlowState(CommercialCorridorState.ACTIVE)).toBe(true);
  });

  it("VENEXT_SUPPLY_FLOW_MAX_DEPTH clamps propagation depth", () => {
    const prev = process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH;
    process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH = "2";
    expect(new RelationalSupplyFlowPolicyService().maxPropagationDepth()).toBe(2);
    process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH = "999";
    expect(new RelationalSupplyFlowPolicyService().maxPropagationDepth()).toBe(32);
    if (prev === undefined) delete process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH;
    else process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH = prev;
  });
  it("assertSupplyFlowMutationAllowed documents TERMINATED diagnostics", () => {
    const r = policy.assertSupplyFlowMutationAllowed(CommercialCorridorState.TERMINATED);
    expect(r.allowed).toBe(false);
    expect(r.diagnostics.corridorTerminated).toBe(true);
    expect(r.diagnostics.mutationBlocked).toBe(true);
    expect(r.diagnostics.governanceOperation).toBe("supply_flow_ingestion");
  });
});

describe("RelationalSupplyFlowDependencyService.computeDependencyEdge", () => {
  const base = {
    relationshipId: "00000000-0000-4000-8000-000000000001",
    openIncidentCount: 0,
    coordinationOpenCount: 0,
    blockingFulfillmentTaskCount: 0,
    pressureScore: 40,
    fragilityScore: 30,
    geoFragilityScore: 20,
    sectorMaxOperationalRisk: 35,
    predictiveUnresolvedAvgScore: 0,
    predictiveUnresolvedCount: 0,
    strategicMemoryActiveCount: 0,
    strategicMemoryAvgConfidence: 0,
    operationalMetricStress: 0,
    peerCorridorEdgeCount: 0,
  };

  it("varies dependencyStrength when incident pressure changes", () => {
    const a = RelationalSupplyFlowDependencyService.computeDependencyEdge(base);
    const b = RelationalSupplyFlowDependencyService.computeDependencyEdge({ ...base, openIncidentCount: 4 });
    expect(b.dependencyStrength).toBeGreaterThan(a.dependencyStrength);
    expect(b.diagnostics).toMatchObject({ incidentWeight: expect.any(Number) });
  });
});

describe("RelationalSupplyFlowPropagationService", () => {
  it("DFS respects VENEXT_SUPPLY_FLOW_MAX_DEPTH", async () => {
    const prev = process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH;
    process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH = "1";
    const policy = new RelationalSupplyFlowPolicyService();
    const a = "00000000-0000-4000-8000-000000000001";
    const b = "00000000-0000-4000-8000-000000000002";
    const prisma = {
      relationalSupplyFlowEdge: {
        findMany: vi.fn().mockResolvedValue([{ sourceFlowId: a, targetFlowId: b }]),
      },
    } as any;
    const svc = new RelationalSupplyFlowPropagationService(prisma, policy);
    const r = await svc.projectFlowDisruptionPropagation("00000000-0000-4000-8000-00000000abcd");
    if (prev === undefined) delete process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH;
    else process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH = prev;
    expect(r.maxDepthObserved).toBeLessThanOrEqual(1);
  });
});
