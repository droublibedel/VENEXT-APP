import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { EconomicScenariosBundle } from "@venext/shared-contracts";

import { ScenarioImpactsSurface } from "./ScenarioImpactsSurface";

afterEach(() => cleanup());

function bundleWithSynthetic(): EconomicScenariosBundle {
  const ts = new Date().toISOString();
  const org = "31111111-1111-1111-1111-111111111101";
  const traj = {
    provenance: ["unit"],
    steps: [
      {
        label: "T0" as const,
        systemicRisk: 0.1,
        unstableTerritories: [] as string[],
        impactedPoles: ["p"],
        stabilizationTrend: "FLAT" as const,
        volatilityShift: "FLAT" as const,
        propagationAcceleration: 0.1,
      },
      {
        label: "T1" as const,
        systemicRisk: 0.2,
        unstableTerritories: [],
        impactedPoles: ["p"],
        stabilizationTrend: "FLAT" as const,
        volatilityShift: "FLAT" as const,
        propagationAcceleration: 0.2,
      },
      {
        label: "T2" as const,
        systemicRisk: 0.3,
        unstableTerritories: [],
        impactedPoles: ["p"],
        stabilizationTrend: "FLAT" as const,
        volatilityShift: "FLAT" as const,
        propagationAcceleration: 0.3,
      },
      {
        label: "T3" as const,
        systemicRisk: 0.4,
        unstableTerritories: [],
        impactedPoles: ["p"],
        stabilizationTrend: "FLAT" as const,
        volatilityShift: "FLAT" as const,
        propagationAcceleration: 0.4,
      },
    ],
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
      scenarioCount: 1,
      maxProjectedRisk: 0.5,
      meanStabilizationProbability: 0.5,
      dominantScenarioTypes: ["supply_disruption"],
    },
    scenarios: [
      {
        scenarioCode: "c1",
        scenarioType: "supply_disruption",
        triggerType: "t",
        severity: "HIGH",
        sourcePole: "supply_logistics",
        confidence: 0.6,
        affectedPoles: ["supply_logistics"],
        affectedTerritories: ["SN_DAKAR"],
        projectedRisk: 0.55,
        stabilizationProbability: 0.5,
        estimatedPropagationDepth: 2,
        trajectory: traj,
        impacts: [
          {
            targetPole: "order_adv",
            impactKind: "x:synthetic_cross_pole",
            intensity: 0.3,
            confidence: 0.5,
            source: "SYNTHETIC_FALLBACK",
            observational: false,
            explanation: "Synthetic fallback — not observed propagation (synthetic fallback).",
            sourceSignals: ["source:SYNTHETIC_FALLBACK"],
          },
        ],
      },
    ],
    comparisons: [],
  };
}

describe("ScenarioImpactsSurface", () => {
  it("labels synthetic fallback impacts distinctly", () => {
    render(<ScenarioImpactsSurface bundle={bundleWithSynthetic()} />);
    expect(screen.getByText(/synthetic projection/i)).toBeTruthy();
  });
});
