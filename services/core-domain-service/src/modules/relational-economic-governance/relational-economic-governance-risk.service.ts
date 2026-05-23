import { Injectable } from "@nestjs/common";

import type { EconomicGovernanceCorridorContext } from "./relational-economic-governance-corridor-context.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";

export type GovernanceRiskResult = {
  systemicRisk: number;
  propagationPressure: number;
  governanceStability: number;
};

@Injectable()
export class RelationalEconomicGovernanceRiskService {
  constructor(private readonly policy: RelationalEconomicGovernancePolicyService) {}

  computeRisk(ctx: EconomicGovernanceCorridorContext): GovernanceRiskResult {
    const propagationPressure = this.policy.clampInt(
      ctx.macroPropagationRisk * 0.45 + ctx.pressureGraphScore * 0.35 + ctx.supplyFlowDisruptionAvg * 0.2,
    );
    const systemicRisk = this.policy.clampInt(
      ctx.systemicAutonomyRisk * 0.25 +
        propagationPressure * 0.25 +
        ctx.activeRecoveryInstability * 0.2 +
        ctx.openIncidentCount * 8 +
        ctx.predictiveHighRiskCount * 10,
    );
    const governanceStability = this.policy.clampInt(
      100 -
        systemicRisk * 0.4 -
        ctx.activeRecoveryInstability * 0.25 -
        (100 - ctx.continuityScore) * 0.2 -
        ctx.strategicCaptivityRisk * 0.15,
    );
    return { systemicRisk, propagationPressure, governanceStability };
  }
}
