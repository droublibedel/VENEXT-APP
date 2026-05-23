import { describe, expect, it, vi } from "vitest";

import { CoordinationConflictService } from "./economic-coordination/coordination-conflict.service";
import { EconomicCoordinationRealtimePublishService } from "./economic-coordination/economic-coordination-realtime-publish.service";
import {
  buildDisabledEscalationSlice,
  buildDisabledMemorySlice,
} from "./economic-coordination/economic-coordination-stub-builders";
import {
  isFinanceShock,
  isStrategicShock,
  isSupplyShock,
} from "./economic-coordination/economic-coordination-shock-taxonomy";
import { EconomicPostureService } from "./economic-coordination/economic-posture.service";
import type { EconomicCoordinationSnapshot } from "@venext/shared-contracts";

describe("Instruction 18.4 — economic coordination", () => {
  const postureSvc = new EconomicPostureService();
  const conflictSvc = new CoordinationConflictService();

  const leanSnapshot = (): EconomicCoordinationSnapshot =>
    ({
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: "31111111-1111-1111-1111-111111111101",
      propagationBundle: {
        overview: { systemicRiskRollup: 0.12, shockCount: 2 },
        shocks: [{ type: "supply_delay", sourcePole: "SUPPLY_LOGISTICS", systemicRisk: 0.2 }],
        territoryFragility: [{ fragilityScore: 0.2, relationshipExposure: 0.1, logisticsExposure: 0.15, territory: "T1" }],
      },
      scenariosBundle: {
        overview: { meanStabilizationProbability: 0.55, maxProjectedRisk: 0.2 },
        scenarios: [],
      },
      memoryContext: { crisisSignatures: [] },
      dataIntelligenceBundle: { correlations: { rows: [{}, {}] } },
      realtimePressure: 0.15,
      organizationSignals: 0.2,
      systemicIntelligencePressure: 0.25,
      operationalPressure: 0.18,
      financialPressure: 0.1,
      logisticsPressure: 0.22,
    }) as EconomicCoordinationSnapshot;

  it("posture is deterministic for identical lean snapshots", () => {
    const a = leanSnapshot();
    const b = leanSnapshot();
    expect(postureSvc.derive(a)).toEqual(postureSvc.derive(b));
  });

  it("detects scenario stabilization vs risk conflict when thresholds crossed", () => {
    const snap = {
      ...leanSnapshot(),
      scenariosBundle: {
        ...leanSnapshot().scenariosBundle,
        scenarios: [
          {
            scenarioCode: "c1",
            scenarioType: "t",
            triggerType: "x",
            severity: "HIGH",
            sourcePole: "SUPPLY_LOGISTICS",
            confidence: 0.6,
            affectedPoles: ["SUPPLY_LOGISTICS"],
            affectedTerritories: [],
            projectedRisk: 0.6,
            stabilizationProbability: 0.7,
            estimatedPropagationDepth: 1,
            trajectory: { provenance: ["p"], steps: [] },
            impacts: [],
            metadata: {},
          },
        ],
      },
    } as EconomicCoordinationSnapshot;
    const conflicts = conflictSvc.detect(snap);
    expect(conflicts.some((c) => c.conflictType === "SCENARIO_STABILIZATION_VS_RISK")).toBe(true);
  });

  it("disabled escalation stub matches slice contract fields", () => {
    const e = buildDisabledEscalationSlice();
    expect(e.escalationDrivers).toEqual(["economic_escalation_disabled"]);
    expect(e.diagnostics).toContain("flag:economic_escalation_enabled=false");
  });

  it("disabled memory stub matches slice contract fields", () => {
    const m = buildDisabledMemorySlice();
    expect(m.diagnostics).toEqual(["flag:coordination_memory_enabled=false"]);
  });

  it("classifies known propagation shocks via taxonomy", () => {
    expect(isSupplyShock({ type: "shipment_delayed", sourcePole: "supply_logistics" } as never)).toBe(true);
    expect(isFinanceShock({ type: "liquidity_collapse", sourcePole: "finance_collections" } as never)).toBe(true);
    expect(isStrategicShock({ type: "data_intelligence_volume_spike", sourcePole: "data_intelligence" } as never)).toBe(true);
  });

  it("detects logistics vs systemic intelligence proxy conflict when thresholds crossed", () => {
    const snap = {
      ...leanSnapshot(),
      logisticsPressure: 0.5,
      systemicIntelligencePressure: 0.56,
    } as EconomicCoordinationSnapshot;
    const conflicts = conflictSvc.detect(snap);
    expect(conflicts.some((c) => c.conflictType === "DISTRIBUTION_SATURATION_VS_SYSTEMIC_INTELLIGENCE_PRESSURE")).toBe(true);
  });

  it("realtime publish uses Promise.allSettled and does not throw when fan-out rejects", async () => {
    const post = vi.fn().mockRejectedValue(new Error("network"));
    const fanout = { isConfigured: () => true, postDomainSignal: post } as never;
    const svc = new EconomicCoordinationRealtimePublishService(fanout);
    const bundle = { conflicts: [], posture: { posture: "STABLE" }, escalation: { escalationLevel: "LOW" } } as never;
    expect(() => svc.publishCoordinationPulse("31111111-1111-1111-1111-111111111101", bundle)).not.toThrow();
    await new Promise((r) => setTimeout(r, 40));
    expect(post).toHaveBeenCalled();
  });
});
