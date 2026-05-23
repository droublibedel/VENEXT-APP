import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicObservatoryPriority,
  RelationalStrategicObservatorySeverity,
} from "@prisma/client";

import type { StrategicObservatoryCorridorContext } from "./relational-strategic-observatory-corridor-context.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";

@Injectable()
export class RelationalStrategicObservatoryPriorityService {
  constructor(private readonly policy: RelationalStrategicObservatoryPolicyService) {}

  computeExecutiveUrgency(ctx: StrategicObservatoryCorridorContext): number {
    return this.policy.clampInt(
      ctx.topOperationsExecutivePressure * 0.35 +
        ctx.topOperationsScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalStrategicObservatoryPriority {
    if (score >= 80) return RelationalStrategicObservatoryPriority.CRITICAL;
    if (score >= 62) return RelationalStrategicObservatoryPriority.HIGH;
    if (score >= 40) return RelationalStrategicObservatoryPriority.MEDIUM;
    return RelationalStrategicObservatoryPriority.LOW;
  }

  toSeverity(urgency: number): RelationalStrategicObservatorySeverity {
    if (urgency >= 78) return RelationalStrategicObservatorySeverity.CRITICAL;
    if (urgency >= 58) return RelationalStrategicObservatorySeverity.HIGH;
    if (urgency >= 38) return RelationalStrategicObservatorySeverity.MEDIUM;
    return RelationalStrategicObservatorySeverity.LOW;
  }
}
