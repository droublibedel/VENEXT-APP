import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveOrchestrationPriority,
  RelationalExecutiveOrchestrationSeverity,
} from "@prisma/client";

import type { ExecutiveOrchestrationCorridorContext } from "./relational-executive-orchestration-corridor-context.service";
import { RelationalExecutiveOrchestrationPolicyService } from "./relational-executive-orchestration-policy.service";

@Injectable()
export class RelationalExecutiveOrchestrationPriorityService {
  constructor(private readonly policy: RelationalExecutiveOrchestrationPolicyService) {}

  computeExecutivePriority(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.policy.clampInt(
      ctx.topExecutivePressure * 0.35 +
        ctx.topSystemicRisk * 0.25 +
        ctx.topStabilizationUrgency * 0.2 +
        ctx.topArbitrationUrgency * 0.2,
    );
  }

  toPriority(score: number): RelationalExecutiveOrchestrationPriority {
    if (score >= 80) return RelationalExecutiveOrchestrationPriority.CRITICAL;
    if (score >= 62) return RelationalExecutiveOrchestrationPriority.HIGH;
    if (score >= 40) return RelationalExecutiveOrchestrationPriority.MEDIUM;
    return RelationalExecutiveOrchestrationPriority.LOW;
  }

  toSeverity(urgency: number): RelationalExecutiveOrchestrationSeverity {
    if (urgency >= 78) return RelationalExecutiveOrchestrationSeverity.CRITICAL;
    if (urgency >= 58) return RelationalExecutiveOrchestrationSeverity.HIGH;
    if (urgency >= 38) return RelationalExecutiveOrchestrationSeverity.MEDIUM;
    return RelationalExecutiveOrchestrationSeverity.LOW;
  }
}
