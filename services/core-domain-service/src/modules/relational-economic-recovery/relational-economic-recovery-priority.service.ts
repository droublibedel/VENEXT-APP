import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicRecoveryPriority,
  RelationalEconomicRecoverySeverity,
} from "@prisma/client";

import type { EconomicRecoveryCorridorContext } from "./relational-economic-recovery-corridor-context.service";
import { RelationalEconomicRecoveryPolicyService } from "./relational-economic-recovery-policy.service";

export type RecoveryPriorityResult = {
  recoveryPriorityScore: number;
  interventionUrgency: number;
  corridorCriticality: number;
  recoveryWindowRisk: number;
  recoveryPriority: RelationalEconomicRecoveryPriority;
  severity: RelationalEconomicRecoverySeverity;
};

@Injectable()
export class RelationalEconomicRecoveryPriorityService {
  constructor(private readonly policy: RelationalEconomicRecoveryPolicyService) {}

  computePriority(ctx: EconomicRecoveryCorridorContext): RecoveryPriorityResult {
    const instability = this.policy.clampInt(
      ctx.continuityInstability * 0.35 +
        (100 - ctx.continuityScore) * 0.25 +
        ctx.openIncidentCount * 8,
    );
    const sovereigntyWeakness = this.policy.clampInt(
      (100 - ctx.autonomyScore) * 0.4 + ctx.strategicCaptivityRisk * 0.35 + ctx.systemicAutonomyRisk * 0.25,
    );
    const dependencyConcentration = this.policy.clampInt(
      ctx.dependencyExposureScore * 0.5 +
        ctx.macroDependencyCount * 6 +
        ctx.sovereigntyDependencyCount * 4,
    );
    const captivity = ctx.strategicCaptivityRisk;
    const propagation = this.policy.clampInt(ctx.macroPropagationRisk * 0.6 + ctx.pressureScore * 0.4);
    const pressureDensity = this.policy.clampInt(ctx.pressureScore * 0.7 + ctx.supplyFlowDisruptionAvg * 0.3);

    const recoveryPriorityScore = this.policy.clampInt(
      instability * 0.22 +
        sovereigntyWeakness * 0.2 +
        dependencyConcentration * 0.18 +
        captivity * 0.15 +
        propagation * 0.15 +
        pressureDensity * 0.1,
    );
    const interventionUrgency = this.policy.clampInt(
      recoveryPriorityScore * 0.55 + ctx.predictiveHighRiskCount * 10 + ctx.orchestrationOpenCount * 12,
    );
    const recoveryComplexity = this.policy.clampInt(
      dependencyConcentration * 0.4 +
        ctx.sovereigntyDependencyCount * 3 +
        ctx.continuityDependencyCount * 2 +
        ctx.supplyFlowEdgeCount * 2,
    );
    const corridorCriticality = this.policy.clampInt(
      (100 - ctx.sovereigntyScore) * 0.5 + interventionUrgency * 0.5,
    );
    const recoveryWindowRisk = this.policy.clampInt(
      recoveryComplexity * 0.45 + (100 - ctx.corridorSelfRecoveryProbability * 100) * 0.55,
    );

    const recoveryPriority = this.toPriority(recoveryPriorityScore);
    const severity = this.toSeverity(recoveryPriorityScore);

    return {
      recoveryPriorityScore,
      interventionUrgency,
      corridorCriticality,
      recoveryWindowRisk,
      recoveryPriority,
      severity,
    };
  }

  private toPriority(score: number): RelationalEconomicRecoveryPriority {
    if (score >= 78) return RelationalEconomicRecoveryPriority.CRITICAL;
    if (score >= 62) return RelationalEconomicRecoveryPriority.HIGH;
    if (score >= 42) return RelationalEconomicRecoveryPriority.MEDIUM;
    return RelationalEconomicRecoveryPriority.LOW;
  }

  private toSeverity(score: number): RelationalEconomicRecoverySeverity {
    if (score >= 78) return RelationalEconomicRecoverySeverity.CRITICAL;
    if (score >= 55) return RelationalEconomicRecoverySeverity.HIGH;
    if (score >= 35) return RelationalEconomicRecoverySeverity.MEDIUM;
    return RelationalEconomicRecoverySeverity.LOW;
  }
}
