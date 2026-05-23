import { Injectable } from "@nestjs/common";
import type { EconomicPropagationBundle, ScenarioTrajectoryPack } from "@venext/shared-contracts";
import type { GeneratedScenarioCore } from "./scenario-generation.service";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

@Injectable()
export class ScenarioTrajectoryService {
  project(bundle: EconomicPropagationBundle, core: GeneratedScenarioCore): ScenarioTrajectoryPack {
    const rollup = bundle.overview.systemicRiskRollup;
    const shockN = bundle.shocks.length;
    const maxDepth = bundle.chains.reduce((m, c) => Math.max(m, c.propagationDepth), 0);
    const fragileN = bundle.territoryFragility.filter((t) => t.fragilityScore > 0.35).length;
    const terrSorted = [...bundle.territoryFragility].sort((a, b) => b.fragilityScore - a.fragilityScore).map((t) => t.territory);

    const t0Risk = clamp(rollup + core.projectedRisk * 0.08, 0, 1);
    const t1Risk = clamp(t0Risk + shockN * 0.012 + maxDepth * 0.018 + fragileN * 0.015, 0, 1);
    const t2Risk = clamp(t1Risk + core.estimatedPropagationDepth * 0.02 - core.stabilizationProbability * 0.04, 0, 1);
    const t3Risk = clamp(t2Risk + (core.projectedRisk - rollup) * 0.06, 0, 1);

    const poles = core.affectedPoles.slice(0, 8);

    const mkStep = (
      label: "T0" | "T1" | "T2" | "T3",
      systemicRisk: number,
      extraTerr: number,
    ): ScenarioTrajectoryPack["steps"][number] => ({
      label,
      systemicRisk: Number(systemicRisk.toFixed(3)),
      unstableTerritories: terrSorted.slice(0, Math.min(6, 2 + extraTerr)),
      impactedPoles: poles,
      stabilizationTrend:
        systemicRisk < t0Risk - 0.02 ? "IMPROVING" : systemicRisk > t0Risk + 0.06 ? "DEGRADING" : "FLAT",
      volatilityShift: shockN > 4 ? "UP" : shockN < 2 ? "DOWN" : "FLAT",
      propagationAcceleration: Number(clamp(0.4 + maxDepth * 0.08 + fragileN * 0.04, 0, 2).toFixed(3)),
    });

    return {
      provenance: [
        `propagation.systemicRiskRollup:${rollup.toFixed(3)}`,
        `propagation.shockCount:${shockN}`,
        `propagation.maxChainDepth:${maxDepth}`,
        `scenario.projectedRisk:${core.projectedRisk.toFixed(3)}`,
      ],
      steps: [
        mkStep("T0", t0Risk, 0),
        mkStep("T1", t1Risk, 1),
        mkStep("T2", t2Risk, 2),
        mkStep("T3", t3Risk, 3),
      ],
    };
  }
}
