import { Injectable } from "@nestjs/common";
import type { EconomicScenarioProjection, ScenarioComparisonRow } from "@venext/shared-contracts";

@Injectable()
export class ScenarioComparisonService {
  compareAll(scenarios: EconomicScenarioProjection[]): ScenarioComparisonRow[] {
    const out: ScenarioComparisonRow[] = [];
    const slice = scenarios.slice(0, 6);
    for (let i = 0; i < slice.length; i++) {
      for (let j = i + 1; j < slice.length; j++) {
        out.push(this.comparePair(slice[i]!, slice[j]!));
      }
    }
    return out.slice(0, 24);
  }

  comparePair(a: EconomicScenarioProjection, b: EconomicScenarioProjection): ScenarioComparisonRow {
    const typeMatch = a.scenarioType === b.scenarioType ? 0.35 : 0;
    const poleOverlap = a.affectedPoles.filter((p) => b.affectedPoles.includes(p)).length;
    const terrOverlap = a.affectedTerritories.filter((t) => b.affectedTerritories.includes(t)).length;
    const similarityScore = Math.min(
      1,
      typeMatch + poleOverlap * 0.08 + terrOverlap * 0.05 + (1 - Math.abs(a.projectedRisk - b.projectedRisk)) * 0.25,
    );
    const escalationGap = Number((a.projectedRisk - b.projectedRisk).toFixed(3));
    const stabilizationGap = Number((a.stabilizationProbability - b.stabilizationProbability).toFixed(3));
    return {
      scenarioA: { scenarioCode: a.scenarioCode, scenarioType: a.scenarioType },
      scenarioB: { scenarioCode: b.scenarioCode, scenarioType: b.scenarioType },
      similarityScore: Number(similarityScore.toFixed(3)),
      escalationGap,
      stabilizationGap,
      systemicDifference: Number(
        ((a.estimatedPropagationDepth - b.estimatedPropagationDepth) / 12 + escalationGap * 0.4).toFixed(3),
      ),
      collapseSpeedHint:
        escalationGap > 0.12
          ? "Scenario A escalates faster on projected risk axis — heuristic, not timed forecast."
          : "Comparable collapse velocity on risk axis — still symbolic projection.",
      recoveryHint:
        stabilizationGap > 0.08
          ? "Scenario A shows wider stabilization band in this deterministic lattice."
          : "Stabilization envelopes are close — operator judgment required.",
      territoriesAffectedDelta: Math.abs(a.affectedTerritories.length - b.affectedTerritories.length),
    };
  }
}
