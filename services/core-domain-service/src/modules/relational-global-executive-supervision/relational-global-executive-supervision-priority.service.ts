import { Injectable } from "@nestjs/common";
import {
  RelationalGlobalExecutiveSupervisionPriority,
  RelationalGlobalExecutiveSupervisionSeverity,
} from "@prisma/client";

import type { GlobalExecutiveSupervisionCorridorContext } from "./relational-global-executive-supervision-corridor-context.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";

@Injectable()
export class RelationalGlobalExecutiveSupervisionPriorityService {
  constructor(private readonly policy: RelationalGlobalExecutiveSupervisionPolicyService) {}

  computeExecutiveUrgency(ctx: GlobalExecutiveSupervisionCorridorContext): number {
    return this.policy.clampInt(
      ctx.topOperationsExecutivePressure * 0.35 +
        ctx.topOperationsScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalGlobalExecutiveSupervisionPriority {
    if (score >= 80) return RelationalGlobalExecutiveSupervisionPriority.CRITICAL;
    if (score >= 62) return RelationalGlobalExecutiveSupervisionPriority.HIGH;
    if (score >= 40) return RelationalGlobalExecutiveSupervisionPriority.MEDIUM;
    return RelationalGlobalExecutiveSupervisionPriority.LOW;
  }

  toSeverity(urgency: number): RelationalGlobalExecutiveSupervisionSeverity {
    if (urgency >= 78) return RelationalGlobalExecutiveSupervisionSeverity.CRITICAL;
    if (urgency >= 58) return RelationalGlobalExecutiveSupervisionSeverity.HIGH;
    if (urgency >= 38) return RelationalGlobalExecutiveSupervisionSeverity.MEDIUM;
    return RelationalGlobalExecutiveSupervisionSeverity.LOW;
  }
}
