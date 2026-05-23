import { describe, expect, it } from "vitest";

import { extractCorridorIntelligenceRealtimePayload } from "./realtime-economic-signal.gateway";

const orgA = "00000000-0000-4000-8000-0000000000aa";
const orgB = "00000000-0000-4000-8000-0000000000bb";

const base = {
  relationshipId: "00000000-0000-4000-8000-000000000001",
  corridorState: "ACTIVE",
  corridorHealthBand: "MEDIUM",
  changedSignals: ["STABLE_ORDER_FLOW"],
  heuristicOnly: true,
  computedAt: "2026-01-01T00:00:00.000Z",
  privateEconomicCorridor: true,
  publicRankingDisabled: true,
  marketplaceExposureDisabled: true,
  intendedTargetOrganizationIds: [orgA, orgB],
  deliveredTargetOrganizationIds: [orgA, orgB],
  emittedToAllCorridorParties: false,
  partialDeliveryReason: "per_organization_corridor_fanout_round",
} as const;

describe("Instruction 20.4B — corridor intelligence realtime minimalism", () => {
  it("extracts Zod-validated corridor payload (delivery honesty fields)", () => {
    const p = extractCorridorIntelligenceRealtimePayload("commercial.corridor.updated", { ...base });
    expect(p?.relationshipId).toBe("00000000-0000-4000-8000-000000000001");
    expect(p?.corridorHealthBand).toBe("MEDIUM");
    expect(p?.changedSignals).toEqual(["STABLE_ORDER_FLOW"]);
    expect(p?.intendedTargetOrganizationIds).toEqual([orgA, orgB]);
    expect(p?.deliveredTargetOrganizationIds).toEqual([orgA, orgB]);
    expect(p?.emittedToAllCorridorParties).toBe(false);
  });

  it("accepts emittedToAllCorridorParties true when two distinct parties are fully delivered", () => {
    const p = extractCorridorIntelligenceRealtimePayload("commercial.corridor.updated", {
      ...base,
      emittedToAllCorridorParties: true,
      partialDeliveryReason: null,
    });
    expect(p?.emittedToAllCorridorParties).toBe(true);
  });

  it("rejects fat bodies with extra keys", () => {
    const p = extractCorridorIntelligenceRealtimePayload("commercial.corridor.updated", {
      ...base,
      trustScore: 42,
    } as Record<string, unknown>);
    expect(p).toBeUndefined();
  });

  it("rejects missing honesty literals", () => {
    const p = extractCorridorIntelligenceRealtimePayload("commercial.corridor.updated", {
      relationshipId: "00000000-0000-4000-8000-000000000001",
      corridorState: "ACTIVE",
      corridorHealthBand: "HIGH",
      changedSignals: [],
      heuristicOnly: true,
      computedAt: "2026-01-01T00:00:00.000Z",
    } as Record<string, unknown>);
    expect(p).toBeUndefined();
  });

  it("rejects arbitrary corridorState strings (strict enum)", () => {
    const p = extractCorridorIntelligenceRealtimePayload("commercial.corridor.updated", {
      ...base,
      corridorState: "NOT_A_REAL_STATE",
    });
    expect(p).toBeUndefined();
  });

  it("rejects invalid changedSignals (non-union tokens)", () => {
    const p = extractCorridorIntelligenceRealtimePayload("commercial.corridor.updated", {
      ...base,
      changedSignals: ["NOT_A_SIGNAL_OR_CHANGE_TOKEN"],
    });
    expect(p).toBeUndefined();
  });

  it("accepts realtime change tokens mixed with engine signal types", () => {
    const p = extractCorridorIntelligenceRealtimePayload("commercial.corridor.updated", {
      ...base,
      changedSignals: ["STATE_CHANGED", "HEALTH_BAND_CHANGED", "STABLE_ORDER_FLOW"],
    });
    expect(p?.changedSignals).toEqual(["STATE_CHANGED", "HEALTH_BAND_CHANGED", "STABLE_ORDER_FLOW"]);
  });

  it("single intended party cannot claim emittedToAllCorridorParties true under Zod", () => {
    const p = extractCorridorIntelligenceRealtimePayload("commercial.corridor.updated", {
      ...base,
      intendedTargetOrganizationIds: [orgA],
      deliveredTargetOrganizationIds: [orgA],
      emittedToAllCorridorParties: true,
    });
    expect(p).toBeUndefined();
  });
});
