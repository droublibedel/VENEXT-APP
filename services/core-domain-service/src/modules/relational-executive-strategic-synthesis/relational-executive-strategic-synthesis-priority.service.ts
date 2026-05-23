import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveStrategicSynthesisPriority,
  RelationalExecutiveStrategicSynthesisSeverity,
} from "@prisma/client";

import type { ExecutiveStrategicSynthesisCorridorContext } from "./relational-executive-strategic-synthesis-corridor-context.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";

@Injectable()
export class RelationalExecutiveStrategicSynthesisPriorityService {
  constructor(private readonly policy: RelationalExecutiveStrategicSynthesisPolicyService) {}

  computeExecutiveUrgency(ctx: ExecutiveStrategicSynthesisCorridorContext): number {
    return this.policy.clampInt(
      ctx.topOperationsExecutivePressure * 0.35 +
        ctx.topOperationsScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalExecutiveStrategicSynthesisPriority {
    if (score >= 80) return RelationalExecutiveStrategicSynthesisPriority.CRITICAL;
    if (score >= 62) return RelationalExecutiveStrategicSynthesisPriority.HIGH;
    if (score >= 40) return RelationalExecutiveStrategicSynthesisPriority.MEDIUM;
    return RelationalExecutiveStrategicSynthesisPriority.LOW;
  }

  toSeverity(urgency: number): RelationalExecutiveStrategicSynthesisSeverity {
    if (urgency >= 78) return RelationalExecutiveStrategicSynthesisSeverity.CRITICAL;
    if (urgency >= 58) return RelationalExecutiveStrategicSynthesisSeverity.HIGH;
    if (urgency >= 38) return RelationalExecutiveStrategicSynthesisSeverity.MEDIUM;
    return RelationalExecutiveStrategicSynthesisSeverity.LOW;
  }
}
