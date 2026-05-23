import { Injectable } from "@nestjs/common";

import type { EconomicStabilizationCorridorContext } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";

@Injectable()
export class RelationalEconomicStabilizationPressureService {
  constructor(private readonly policy: RelationalEconomicStabilizationPolicyService) {}

  computeGovernancePressure(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(100 - ctx.activeGovernanceStability + ctx.topConflictPressure * 0.3);
  }

  computeArbitrationPressure(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(ctx.topArbitrationScore * 0.7 + ctx.topArbitrationUrgency * 0.3);
  }

  computeRecoveryPressure(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeRecoveryInstability * 0.55 + ctx.activeRecoveryInterventionPriority * 0.45,
    );
  }

  computeCoordinationStress(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(
      ctx.orchestrationOpenCount * 12 + ctx.peerRelationshipCount * 4 + ctx.governanceConflictCount * 6,
    );
  }
}
