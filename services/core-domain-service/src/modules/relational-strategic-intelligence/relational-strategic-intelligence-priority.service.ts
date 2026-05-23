import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicIntelligencePriority,
  RelationalStrategicIntelligenceSeverity,
} from "@prisma/client";

import type { StrategicIntelligenceCorridorContext } from "./relational-strategic-intelligence-corridor-context.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";

@Injectable()
export class RelationalStrategicIntelligencePriorityService {
  constructor(private readonly policy: RelationalStrategicIntelligencePolicyService) {}

  computeExecutiveUrgency(ctx: StrategicIntelligenceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topInstitutionalExecutiveRisk * 0.35 +
        ctx.topInstitutionalScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalStrategicIntelligencePriority {
    if (score >= 80) return RelationalStrategicIntelligencePriority.CRITICAL;
    if (score >= 62) return RelationalStrategicIntelligencePriority.HIGH;
    if (score >= 40) return RelationalStrategicIntelligencePriority.MEDIUM;
    return RelationalStrategicIntelligencePriority.LOW;
  }

  toSeverity(urgency: number): RelationalStrategicIntelligenceSeverity {
    if (urgency >= 78) return RelationalStrategicIntelligenceSeverity.CRITICAL;
    if (urgency >= 58) return RelationalStrategicIntelligenceSeverity.HIGH;
    if (urgency >= 38) return RelationalStrategicIntelligenceSeverity.MEDIUM;
    return RelationalStrategicIntelligenceSeverity.LOW;
  }
}
