import { Injectable } from "@nestjs/common";

import type { MacroEconomicCorridorContext } from "./relational-macro-economic-corridor-context.service";
import type { MacroResilienceScores } from "./relational-macro-economic-resilience.service";
import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";

@Injectable()
export class RelationalMacroEconomicAdaptationService {
  constructor(private readonly policy: RelationalMacroEconomicPolicyService) {}

  assessAdaptationReadiness(ctx: MacroEconomicCorridorContext, scores: MacroResilienceScores): {
    adaptationReadiness: number;
    recoveryHorizon: "SHORT" | "MEDIUM" | "LONG";
    diagnostics: Record<string, unknown>;
  } {
    const memoryBoost = Math.min(20, ctx.strategicMemoryActiveCount * 3);
    const simulationBoost = ctx.simulationOpenCount > 0 ? 8 : 0;
    const reviewBoost = ctx.scenarioReviewOpenCount > 0 ? 6 : 0;
    const adaptationReadiness = this.policy.clampInt(
      scores.adaptationCapacity + memoryBoost + simulationBoost + reviewBoost - scores.economicStress * 0.15,
    );
    const recoveryHorizon =
      scores.corridorRecoveryProbability >= 0.65
        ? "SHORT"
        : scores.corridorRecoveryProbability >= 0.4
          ? "MEDIUM"
          : "LONG";
    return {
      adaptationReadiness,
      recoveryHorizon,
      diagnostics: {
        memoryBoost,
        simulationBoost,
        reviewBoost,
        corridorRecoveryProbability: scores.corridorRecoveryProbability,
      },
    };
  }
}
