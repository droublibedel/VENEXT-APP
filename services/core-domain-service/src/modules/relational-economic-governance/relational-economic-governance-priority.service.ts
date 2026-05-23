import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicGovernancePriority,
  RelationalEconomicGovernanceSeverity,
} from "@prisma/client";

import type { EconomicGovernanceCorridorContext } from "./relational-economic-governance-corridor-context.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";

export type GovernancePriorityResult = {
  governancePriorityScore: number;
  interventionUrgency: number;
  corridorCriticality: number;
  interventionWindow: number;
  governancePriority: RelationalEconomicGovernancePriority;
  severity: RelationalEconomicGovernanceSeverity;
};

@Injectable()
export class RelationalEconomicGovernancePriorityService {
  constructor(private readonly policy: RelationalEconomicGovernancePolicyService) {}

  computePriority(ctx: EconomicGovernanceCorridorContext): GovernancePriorityResult {
    const recoveryComplexity = this.policy.clampInt(
      ctx.activeRecoveryInterventionPriority * 0.4 +
        ctx.sovereigntyDependencyCount * 4 +
        ctx.continuityDependencyCount * 3,
    );
    const continuityDegradation = this.policy.clampInt(
      (100 - ctx.continuityScore) * 0.5 + ctx.continuityInstability * 0.5,
    );
    const sovereigntyWeakness = this.policy.clampInt(
      (100 - ctx.autonomyScore) * 0.45 + ctx.strategicCaptivityRisk * 0.55,
    );
    const pressureDensity = this.policy.clampInt(ctx.pressureGraphScore * 0.7 + ctx.dependencyScore * 0.3);
    const propagationRisk = this.policy.clampInt(ctx.macroPropagationRisk * 0.6 + ctx.pressureScore * 0.4);
    const dependencyConcentration = this.policy.clampInt(
      ctx.dependencyExposureScore * 0.5 + ctx.macroDependencyCount * 5,
    );
    const systemicInstability = this.policy.clampInt(
      ctx.activeRecoveryInstability * 0.35 + ctx.systemicAutonomyRisk * 0.35 + ctx.openIncidentCount * 8,
    );
    const territorialImbalance = this.policy.clampInt(ctx.peerRelationshipCount * 2);
    const sectorOverload = this.policy.clampInt(ctx.sectorSlug ? 12 : 0);

    const governancePriorityScore = this.policy.clampInt(
      recoveryComplexity * 0.14 +
        continuityDegradation * 0.14 +
        sovereigntyWeakness * 0.14 +
        pressureDensity * 0.12 +
        propagationRisk * 0.12 +
        dependencyConcentration * 0.12 +
        systemicInstability * 0.12 +
        territorialImbalance * 0.05 +
        sectorOverload * 0.05,
    );
    const interventionUrgency = this.policy.clampInt(
      governancePriorityScore * 0.55 + ctx.activeRecoveryInterventionPriority * 0.25 + ctx.orchestrationOpenCount * 10,
    );
    const corridorCriticality = this.policy.clampInt(
      interventionUrgency * 0.5 + continuityDegradation * 0.3 + sovereigntyWeakness * 0.2,
    );
    const interventionWindow = this.policy.clampInt(
      100 - governancePriorityScore * 0.6 - recoveryComplexity * 0.4,
    );

    return {
      governancePriorityScore,
      interventionUrgency,
      corridorCriticality,
      interventionWindow,
      governancePriority: this.toPriority(governancePriorityScore),
      severity: this.toSeverity(governancePriorityScore),
    };
  }

  private toPriority(score: number): RelationalEconomicGovernancePriority {
    if (score >= 78) return RelationalEconomicGovernancePriority.CRITICAL;
    if (score >= 62) return RelationalEconomicGovernancePriority.HIGH;
    if (score >= 42) return RelationalEconomicGovernancePriority.MEDIUM;
    return RelationalEconomicGovernancePriority.LOW;
  }

  private toSeverity(score: number): RelationalEconomicGovernanceSeverity {
    if (score >= 78) return RelationalEconomicGovernanceSeverity.CRITICAL;
    if (score >= 55) return RelationalEconomicGovernanceSeverity.HIGH;
    if (score >= 35) return RelationalEconomicGovernanceSeverity.MEDIUM;
    return RelationalEconomicGovernanceSeverity.LOW;
  }
}
