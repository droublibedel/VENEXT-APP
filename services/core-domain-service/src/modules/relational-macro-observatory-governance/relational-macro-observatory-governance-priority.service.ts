import { Injectable } from "@nestjs/common";
import {
  RelationalMacroObservatoryGovernancePriority,
  RelationalMacroObservatoryGovernanceSeverity,
} from "@prisma/client";

import type { MacroObservatoryGovernanceCorridorContext } from "./relational-macro-observatory-governance-corridor-context.service";
import { RelationalMacroObservatoryGovernancePolicyService } from "./relational-macro-observatory-governance-policy.service";

@Injectable()
export class RelationalMacroObservatoryGovernancePriorityService {
  constructor(private readonly policy: RelationalMacroObservatoryGovernancePolicyService) {}

  computeExecutiveUrgency(ctx: MacroObservatoryGovernanceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topOperationsExecutivePressure * 0.35 +
        ctx.topOperationsScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalMacroObservatoryGovernancePriority {
    if (score >= 80) return RelationalMacroObservatoryGovernancePriority.CRITICAL;
    if (score >= 62) return RelationalMacroObservatoryGovernancePriority.HIGH;
    if (score >= 40) return RelationalMacroObservatoryGovernancePriority.MEDIUM;
    return RelationalMacroObservatoryGovernancePriority.LOW;
  }

  toSeverity(urgency: number): RelationalMacroObservatoryGovernanceSeverity {
    if (urgency >= 78) return RelationalMacroObservatoryGovernanceSeverity.CRITICAL;
    if (urgency >= 58) return RelationalMacroObservatoryGovernanceSeverity.HIGH;
    if (urgency >= 38) return RelationalMacroObservatoryGovernanceSeverity.MEDIUM;
    return RelationalMacroObservatoryGovernanceSeverity.LOW;
  }
}
