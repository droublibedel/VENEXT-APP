import { Injectable } from "@nestjs/common";

import type { EconomicRecoveryCorridorContext } from "./relational-economic-recovery-corridor-context.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";

@Injectable()
export class RelationalEconomicRecoveryRiskService {
  constructor(private readonly policy: RelationalEconomicRecoveryPolicyService) {}

  computeRecoveryRisk(ctx: EconomicRecoveryCorridorContext): {
    systemicImpactRisk: number;
    instabilityScore: number;
    recoveryComplexity: number;
  } {
    const instabilityScore = this.policy.clampInt(
      ctx.continuityInstability * 0.4 +
        ctx.macroStructuralFragility * 0.3 +
        ctx.supplyFlowDisruptionAvg * 0.3,
    );
    const recoveryComplexity = this.policy.clampInt(
      ctx.macroDependencyCount * 7 +
        ctx.sovereigntyDependencyCount * 5 +
        ctx.continuityDependencyCount * 4 +
        ctx.priorRecoveryPlanCount * 3,
    );
    const systemicImpactRisk = this.policy.clampInt(
      ctx.systemicAutonomyRisk * 0.45 +
        ctx.macroPropagationRisk * 0.35 +
        instabilityScore * 0.2,
    );
    return { systemicImpactRisk, instabilityScore, recoveryComplexity };
  }
}
