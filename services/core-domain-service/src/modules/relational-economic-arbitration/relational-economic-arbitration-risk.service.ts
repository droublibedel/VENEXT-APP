import { Injectable } from "@nestjs/common";

import type { EconomicArbitrationCorridorContext, GovernanceConflictRef } from "./relational-economic-arbitration-corridor-context.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";

@Injectable()
export class RelationalEconomicArbitrationRiskService {
  constructor(private readonly policy: RelationalEconomicArbitrationPolicyService) {}

  computeResolutionRisk(ctx: EconomicArbitrationCorridorContext, conflict?: GovernanceConflictRef): number {
    const base = conflict?.estimatedResolutionComplexity ?? ctx.topConflictPressure;
    return this.policy.clampInt(
      base * 0.5 + ctx.systemicAutonomyRisk * 0.2 + ctx.activeRecoveryInstability * 0.3,
    );
  }

  computeSystemicImpact(ctx: EconomicArbitrationCorridorContext, conflict?: GovernanceConflictRef): number {
    return this.policy.clampInt(
      (conflict?.systemicExposure ?? ctx.topConflictPressure) * 0.55 +
        ctx.macroPropagationRisk * 0.25 +
        ctx.openIncidentCount * 8,
    );
  }
}
