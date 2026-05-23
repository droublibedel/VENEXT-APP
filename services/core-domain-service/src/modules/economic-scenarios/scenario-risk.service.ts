import { Injectable } from "@nestjs/common";
import type { EconomicPropagationBundle, ScenarioRiskAssessment, ScenarioTrajectoryPack } from "@venext/shared-contracts";
import type { GeneratedScenarioCore } from "./scenario-generation.service";

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

@Injectable()
export class ScenarioRiskService {
  assess(
    core: GeneratedScenarioCore,
    bundle: EconomicPropagationBundle,
    trajectory: ScenarioTrajectoryPack,
  ): ScenarioRiskAssessment {
    const last = trajectory.steps[trajectory.steps.length - 1]!;
    const collapseProbability = clamp(0.12 + core.projectedRisk * 0.55 + last.systemicRisk * 0.18, 0, 1);
    const networkStress = clamp(0.15 + bundle.chains.length * 0.04 + core.affectedPoles.length * 0.03, 0, 1);
    const liquidityThreat = clamp(
      0.1 + bundle.shocks.filter((s) => s.type.includes("liquidity") || s.type.includes("payment")).length * 0.07 + core.projectedRisk * 0.2,
      0,
      1,
    );
    const supplyBreakRisk = clamp(
      0.1 + bundle.shocks.filter((s) => s.sourcePole === "supply_logistics").length * 0.08 + core.projectedRisk * 0.22,
      0,
      1,
    );
    const strategicExposure = clamp(0.15 + core.estimatedPropagationDepth / 14 + bundle.overview.systemicRiskRollup * 0.35, 0, 1);
    const recoveryComplexity = clamp(1 - core.stabilizationProbability * 0.65 + networkStress * 0.2, 0, 1);
    const confidence = clamp(0.38 + core.confidence * 0.45, 0.35, 0.9);
    return {
      collapseProbability: Number(collapseProbability.toFixed(3)),
      networkStress: Number(networkStress.toFixed(3)),
      liquidityThreat: Number(liquidityThreat.toFixed(3)),
      supplyBreakRisk: Number(supplyBreakRisk.toFixed(3)),
      strategicExposure: Number(strategicExposure.toFixed(3)),
      recoveryComplexity: Number(recoveryComplexity.toFixed(3)),
      confidence: Number(confidence.toFixed(3)),
      explanation:
        "Heuristic risk lattice from propagation snapshot + scenario stress — transparent weights, not actuarial pricing.",
      sourceSignals: [
        `shocks:${bundle.shocks.length}`,
        `chains:${bundle.chains.length}`,
        `trajectory.T3.systemicRisk:${last.systemicRisk.toFixed(3)}`,
        `scenarioType:${core.scenarioType}`,
      ],
    };
  }
}
