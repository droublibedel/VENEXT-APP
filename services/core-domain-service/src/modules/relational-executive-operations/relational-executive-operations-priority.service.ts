import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveOperationsPriority,
  RelationalExecutiveOperationsSeverity,
} from "@prisma/client";

import type { ExecutiveOperationsCorridorContext } from "./relational-executive-operations-corridor-context.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";

@Injectable()
export class RelationalExecutiveOperationsPriorityService {
  constructor(private readonly policy: RelationalExecutiveOperationsPolicyService) {}

  computeExecutiveUrgency(ctx: ExecutiveOperationsCorridorContext): number {
    return this.policy.clampInt(
      ctx.topCommandExecutiveConcentration * 0.35 +
        ctx.topCommandScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalExecutiveOperationsPriority {
    if (score >= 80) return RelationalExecutiveOperationsPriority.CRITICAL;
    if (score >= 62) return RelationalExecutiveOperationsPriority.HIGH;
    if (score >= 40) return RelationalExecutiveOperationsPriority.MEDIUM;
    return RelationalExecutiveOperationsPriority.LOW;
  }

  toSeverity(urgency: number): RelationalExecutiveOperationsSeverity {
    if (urgency >= 78) return RelationalExecutiveOperationsSeverity.CRITICAL;
    if (urgency >= 58) return RelationalExecutiveOperationsSeverity.HIGH;
    if (urgency >= 38) return RelationalExecutiveOperationsSeverity.MEDIUM;
    return RelationalExecutiveOperationsSeverity.LOW;
  }
}
