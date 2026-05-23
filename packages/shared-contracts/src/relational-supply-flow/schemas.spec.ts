import { describe, expect, it } from "vitest";
import { RelationalSupplyFlowOverviewSchema, isRelationalSupplyFlowRealtimeEventType } from "./schemas.js";

const traversal = {
  cascadeDepth: 0,
  visitedNodes: 0,
  edgeTraversalCount: 0,
  boundedTraversalApplied: false,
};

const overviewDiagnostics = {
  heuristicFallbackUsed: true,
  fallbackReasons: ["no_order_for_corridor"],
  predictiveSignalsUsed: 0,
  strategicMemoriesUsed: 0,
  operationalMetricsUsed: 0,
  productFlowCategories: [] as { category: string; relationalVolume: number }[],
  dominantProductCategory: "UNLABELED",
  volumeConfidenceLevel: "LOW" as const,
  propagationTraversal: traversal,
  downstreamImpact: 0,
};

describe("relational-supply-flow schemas", () => {
  it("accepts minimal overview wire", () => {
    const raw = {
      relationshipId: "00000000-0000-4000-8000-000000000099",
      nodes: [],
      edges: [],
      overviewDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    expect(RelationalSupplyFlowOverviewSchema.safeParse(raw).success).toBe(true);
  });

  it("classifies realtime event types", () => {
    expect(isRelationalSupplyFlowRealtimeEventType("relational.supply.flow_archived")).toBe(true);
    expect(isRelationalSupplyFlowRealtimeEventType("relational.sector.pressure_detected")).toBe(false);
  });
});
