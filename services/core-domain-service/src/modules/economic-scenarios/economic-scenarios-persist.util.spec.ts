import { describe, expect, it, vi } from "vitest";
import type { EconomicScenariosBundle } from "@venext/shared-contracts";
import { runPersistEconomicScenariosBundle } from "./economic-scenarios-persist.util";

function minimalBundleTwoScenarios(): EconomicScenariosBundle {
  const ts = new Date().toISOString();
  const org = "31111111-1111-1111-1111-111111111101";
  const step0 = {
    label: "T0" as const,
    systemicRisk: 0.4,
    unstableTerritories: [] as string[],
    impactedPoles: ["supply_logistics"],
    stabilizationTrend: "FLAT" as const,
    volatilityShift: "FLAT" as const,
    propagationAcceleration: 0.5,
  };
  const step1 = { ...step0, label: "T1" as const, systemicRisk: 0.45 };
  const trajectory = { provenance: ["unit"], steps: [step0, step1] };
  const impacts = [
    {
      targetPole: "order_adv",
      impactKind: "supply_disruption:delay",
      intensity: 0.4,
      confidence: 0.5,
      sourceSignals: ["propagation.chain:c1"],
      observational: true,
    },
  ];
  const common = {
    triggerType: "shipment_delayed",
    severity: "HIGH",
    sourcePole: "supply_logistics",
    confidence: 0.6,
    affectedPoles: ["supply_logistics"],
    affectedTerritories: ["SN_DAKAR"],
    projectedRisk: 0.55,
    stabilizationProbability: 0.5,
    estimatedPropagationDepth: 2,
    trajectory,
    impacts,
    metadata: {},
  };
  return {
    version: "1",
    generatedAt: ts,
    organizationId: org,
    policy: "ACTIVE",
    headline: "h",
    disclaimer: "d",
    overview: {
      version: "1",
      generatedAt: ts,
      organizationId: org,
      policy: "ACTIVE",
      headline: "o",
      scenarioCount: 2,
      maxProjectedRisk: 0.5,
      meanStabilizationProbability: 0.5,
      dominantScenarioTypes: ["supply_disruption", "payment_collapse"],
    },
    scenarios: [
      { scenarioCode: "s1", scenarioType: "supply_disruption", ...common },
      { scenarioCode: "s2", scenarioType: "payment_collapse", ...common },
    ],
    comparisons: [
      {
        scenarioA: { scenarioCode: "s1", scenarioType: "supply_disruption" },
        scenarioB: { scenarioCode: "s2", scenarioType: "payment_collapse" },
        similarityScore: 0.5,
        escalationGap: 0.1,
        stabilizationGap: 0,
        systemicDifference: 0.2,
        collapseSpeedHint: "a",
        recoveryHint: "b",
        territoriesAffectedDelta: 0,
      },
    ],
  };
}

describe("runPersistEconomicScenariosBundle", () => {
  it("batches trajectory and impact rows and persists EconomicScenarioComparison", async () => {
    const trajectoryCreateMany = vi.fn().mockResolvedValue({ count: 2 });
    const impactCreateMany = vi.fn().mockResolvedValue({ count: 1 });
    const trajectoryDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const impactDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const comparisonDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const comparisonCreateMany = vi.fn().mockResolvedValue({ count: 1 });
    const ids: Record<string, string> = {};
    let n = 0;
    const upsert = vi.fn().mockImplementation(async ({ where }: { where: { organizationId_scenarioType: { scenarioType: string } } }) => {
      const st = where.organizationId_scenarioType.scenarioType;
      if (!ids[st]) ids[st] = `sc-${++n}`;
      return { id: ids[st] };
    });
    const prisma = {
      economicScenario: { upsert },
      economicScenarioTrajectory: { deleteMany: trajectoryDeleteMany, createMany: trajectoryCreateMany },
      economicScenarioImpact: { deleteMany: impactDeleteMany, createMany: impactCreateMany },
      economicScenarioComparison: { deleteMany: comparisonDeleteMany, createMany: comparisonCreateMany },
    };
    const log = { warn: vi.fn() };
    await runPersistEconomicScenariosBundle(prisma as never, log, "31111111-1111-1111-1111-111111111101", minimalBundleTwoScenarios());
    expect(trajectoryCreateMany).toHaveBeenCalled();
    expect(trajectoryCreateMany.mock.calls.every((c) => (c[0] as { data: unknown[] }).data.length === 2)).toBe(true);
    expect(impactCreateMany).toHaveBeenCalled();
    expect(impactCreateMany.mock.calls.every((c) => (c[0] as { data: unknown[] }).data.length === 1)).toBe(true);
    expect(comparisonCreateMany).toHaveBeenCalled();
    const cmpData = comparisonCreateMany.mock.calls[0]![0].data as Array<{ similarityScore: number; scenarioAId: string }>;
    expect(cmpData.length).toBe(1);
    expect(cmpData[0]!.similarityScore).toBe(0.5);
  });
});
