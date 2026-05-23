import { Injectable } from "@nestjs/common";

import type { EconomicGovernanceCorridorContext } from "./relational-economic-governance-corridor-context.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";

export type GovernanceBalanceResult = {
  balanceScore: number;
  coordinationPressure: number;
  territorialImbalance: number;
  sectorOverload: number;
  corridorWeight: number;
  strategicImportance: number;
};

@Injectable()
export class RelationalEconomicGovernanceBalanceService {
  constructor(private readonly policy: RelationalEconomicGovernancePolicyService) {}

  computeBalance(ctx: EconomicGovernanceCorridorContext): GovernanceBalanceResult {
    const territorialImbalance = this.policy.clampInt(
      ctx.peerRelationshipCount * 3 + (ctx.territoryCountry.length > 2 ? 8 : 0),
    );
    const sectorOverload = this.policy.clampInt(
      ctx.sectorSlug ? 18 + ctx.macroDependencyCount * 2 : ctx.macroDependencyCount * 3,
    );
    const coordinationPressure = this.policy.clampInt(
      ctx.orchestrationOpenCount * 12 +
        ctx.activeRecoveryInterventionPriority * 0.35 +
        ctx.pressureGraphScore * 0.25,
    );
    const balanceScore = this.policy.clampInt(
      100 -
        territorialImbalance * 0.3 -
        sectorOverload * 0.25 -
        coordinationPressure * 0.25 -
        ctx.activeRecoveryInstability * 0.2,
    );
    const corridorWeight = this.policy.clampInt(
      ctx.activeRecoveryScore * 0.3 + ctx.sovereigntyScore * 0.25 + ctx.continuityScore * 0.25 + balanceScore * 0.2,
    );
    const strategicImportance = this.policy.clampInt(
      corridorWeight * 0.5 + ctx.corridorSelfRecoveryProbability * 50 + ctx.strategicMemoryActiveCount * 5,
    );
    return {
      balanceScore,
      coordinationPressure,
      territorialImbalance,
      sectorOverload,
      corridorWeight,
      strategicImportance,
    };
  }
}
