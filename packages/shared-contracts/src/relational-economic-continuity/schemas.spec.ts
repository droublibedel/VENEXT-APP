import { describe, expect, it } from "vitest";

import {
  isRelationalEconomicContinuityRealtimeEventType,
  RelationalEconomicContinuityOverviewSchema,
  RelationalEconomicContinuityRealtimeSchema,
} from "./schemas.js";

describe("relational-economic-continuity schemas", () => {
  it("rejects overview without disabled flags", () => {
    const r = RelationalEconomicContinuityOverviewSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      nodes: [],
      edges: [],
      persistentCorridors: [],
      fragileCorridors: [],
      continuityScore: 50,
      economicStability: 50,
      instabilityRisk: 30,
      systemicContinuityRisk: 20,
      recoveryProbability: 0.5,
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        macroSnapshotsUsed: 1,
        continuitySnapshotsUsed: 1,
        propagationEventsUsed: 0,
        strategicMemoriesUsed: 0,
        recoveryTraversal: {
          traversalDepth: 0,
          visitedNodes: 0,
          edgeTraversalCount: 0,
          recoveryBounded: false,
          impactedCorridors: 0,
          continuityExposure: 0,
        },
      },
      computedAt: new Date().toISOString(),
    });
    expect(r.success).toBe(false);
  });

  it("whitelists continuity realtime types", () => {
    expect(isRelationalEconomicContinuityRealtimeEventType("relational.continuity.stability_detected")).toBe(true);
    expect(isRelationalEconomicContinuityRealtimeEventType("relational.continuity.unknown")).toBe(false);
    const p = RelationalEconomicContinuityRealtimeSchema.safeParse({
      relationshipId: "00000000-0000-4000-8000-000000000001",
      continuityNodeId: null,
      continuityNodeCode: null,
      intensity: 40,
      recoveryDepth: 0,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(p.success).toBe(true);
  });
});
