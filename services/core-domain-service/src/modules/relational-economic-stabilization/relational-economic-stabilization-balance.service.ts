import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicStabilizationPriority,
  RelationalEconomicStabilizationSeverity,
  RelationalEconomicStabilizationType,
} from "@prisma/client";

import type { EconomicStabilizationCorridorContext } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";

@Injectable()
export class RelationalEconomicStabilizationBalanceService {
  constructor(private readonly policy: RelationalEconomicStabilizationPolicyService) {}

  resolveStabilizationType(
    ctx: EconomicStabilizationCorridorContext,
    systemicExposure: number,
    instabilityPressure: number,
  ): RelationalEconomicStabilizationType {
    if (systemicExposure >= 70) return RelationalEconomicStabilizationType.SYSTEMIC_CONTAINMENT;
    if (instabilityPressure >= 65 && ctx.peerRelationshipCount >= 2) {
      return RelationalEconomicStabilizationType.MULTI_CORRIDOR_RESILIENCE;
    }
    if (ctx.continuityScore < 45 || ctx.activeRecoveryInstability >= 65) {
      return RelationalEconomicStabilizationType.FRAGILE_CORRIDOR;
    }
    return RelationalEconomicStabilizationType.STRATEGIC_STABILIZATION;
  }

  toPriority(score: number): RelationalEconomicStabilizationPriority {
    if (score >= 80) return RelationalEconomicStabilizationPriority.CRITICAL;
    if (score >= 62) return RelationalEconomicStabilizationPriority.HIGH;
    if (score >= 40) return RelationalEconomicStabilizationPriority.MEDIUM;
    return RelationalEconomicStabilizationPriority.LOW;
  }

  toSeverity(urgency: number): RelationalEconomicStabilizationSeverity {
    if (urgency >= 78) return RelationalEconomicStabilizationSeverity.CRITICAL;
    if (urgency >= 58) return RelationalEconomicStabilizationSeverity.HIGH;
    if (urgency >= 38) return RelationalEconomicStabilizationSeverity.MEDIUM;
    return RelationalEconomicStabilizationSeverity.LOW;
  }
}
