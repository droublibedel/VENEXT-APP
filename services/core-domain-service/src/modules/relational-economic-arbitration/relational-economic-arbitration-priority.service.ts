import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicArbitrationPriority,
  RelationalEconomicArbitrationSeverity,
} from "@prisma/client";

import type { EconomicArbitrationCorridorContext, GovernanceConflictRef } from "./relational-economic-arbitration-corridor-context.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";

@Injectable()
export class RelationalEconomicArbitrationPriorityService {
  constructor(private readonly policy: RelationalEconomicArbitrationPolicyService) {}

  computeConflictPriority(conflict: GovernanceConflictRef, ctx: EconomicArbitrationCorridorContext): number {
    return this.policy.clampInt(
      conflict.conflictPressure * 0.45 +
        conflict.recoveryImpact * 0.25 +
        conflict.systemicExposure * 0.2 +
        ctx.activeRecoveryInterventionPriority * 0.1,
    );
  }

  toPriority(score: number): RelationalEconomicArbitrationPriority {
    if (score >= 78) return RelationalEconomicArbitrationPriority.CRITICAL;
    if (score >= 62) return RelationalEconomicArbitrationPriority.HIGH;
    if (score >= 42) return RelationalEconomicArbitrationPriority.MEDIUM;
    return RelationalEconomicArbitrationPriority.LOW;
  }

  toSeverity(score: number): RelationalEconomicArbitrationSeverity {
    if (score >= 78) return RelationalEconomicArbitrationSeverity.CRITICAL;
    if (score >= 55) return RelationalEconomicArbitrationSeverity.HIGH;
    if (score >= 35) return RelationalEconomicArbitrationSeverity.MEDIUM;
    return RelationalEconomicArbitrationSeverity.LOW;
  }
}
