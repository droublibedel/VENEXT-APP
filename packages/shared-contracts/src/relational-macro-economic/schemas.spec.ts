import { describe, expect, it } from "vitest";
import {
  RelationalMacroEconomicResilienceOverviewSchema,
  isRelationalMacroEconomicRealtimeEventType,
} from "./schemas.js";

const traversal = {
  cascadeDepth: 0,
  visitedNodes: 0,
  edgeTraversalCount: 0,
  boundedTraversalApplied: false,
  collapseExposure: 0,
};

const overviewDiagnostics = {
  heuristicFallbackUsed: false,
  fallbackReasons: [] as string[],
  predictiveSignalsUsed: 0,
  strategicMemoriesUsed: 0,
  operationalMetricsUsed: 0,
  supplyFlowNodesUsed: 0,
  sectorNodesUsed: 0,
  propagationTraversal: traversal,
};

describe("relational-macro-economic schemas", () => {
  it("accepts minimal resilience overview", () => {
    const raw = {
      relationshipId: "00000000-0000-4000-8000-000000000099",
      nodes: [],
      edges: [],
      criticalCorridors: [],
      fragileZones: [],
      resilienceScore: 50,
      structuralFragility: 30,
      systemicPressure: 40,
      macroEconomicRisk: 35,
      overviewDiagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    };
    expect(RelationalMacroEconomicResilienceOverviewSchema.safeParse(raw).success).toBe(true);
  });

  it("classifies macro realtime types", () => {
    expect(isRelationalMacroEconomicRealtimeEventType("relational.macro.resilience_detected")).toBe(true);
    expect(isRelationalMacroEconomicRealtimeEventType("relational.supply.flow_created")).toBe(false);
  });
});
