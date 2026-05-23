import { Injectable } from "@nestjs/common";
import { RelationalEconomicMonitoringPriority, RelationalEconomicMonitoringSeverity } from "@prisma/client";

import type { EconomicMonitoringCorridorContext } from "./relational-economic-monitoring-corridor-context.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";

@Injectable()
export class RelationalEconomicMonitoringPriorityService {
  constructor(private readonly policy: RelationalEconomicMonitoringPolicyService) {}

  computeExecutivePriority(ctx: EconomicMonitoringCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStabilizationUrgency * 0.35 +
        ctx.topArbitrationUrgency * 0.25 +
        ctx.topConflictPressure * 0.2 +
        ctx.activeRecoveryInterventionPriority * 0.2,
    );
  }

  toPriority(score: number): RelationalEconomicMonitoringPriority {
    if (score >= 80) return RelationalEconomicMonitoringPriority.CRITICAL;
    if (score >= 62) return RelationalEconomicMonitoringPriority.HIGH;
    if (score >= 40) return RelationalEconomicMonitoringPriority.MEDIUM;
    return RelationalEconomicMonitoringPriority.LOW;
  }

  toSeverity(urgency: number): RelationalEconomicMonitoringSeverity {
    if (urgency >= 78) return RelationalEconomicMonitoringSeverity.CRITICAL;
    if (urgency >= 58) return RelationalEconomicMonitoringSeverity.HIGH;
    if (urgency >= 38) return RelationalEconomicMonitoringSeverity.MEDIUM;
    return RelationalEconomicMonitoringSeverity.LOW;
  }
}
