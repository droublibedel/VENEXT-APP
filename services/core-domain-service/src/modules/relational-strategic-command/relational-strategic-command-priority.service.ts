import { Injectable } from "@nestjs/common";
import {
  RelationalStrategicCommandPriority,
  RelationalStrategicCommandSeverity,
} from "@prisma/client";

import type { StrategicCommandCorridorContext } from "./relational-strategic-command-corridor-context.service";
import { RelationalStrategicCommandPolicyService } from "./relational-strategic-command-policy.service";

@Injectable()
export class RelationalStrategicCommandPriorityService {
  constructor(private readonly policy: RelationalStrategicCommandPolicyService) {}

  computeExecutiveUrgency(ctx: StrategicCommandCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicExecutiveConcentration * 0.35 +
        ctx.topStrategicIntelligenceScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalStrategicCommandPriority {
    if (score >= 80) return RelationalStrategicCommandPriority.CRITICAL;
    if (score >= 62) return RelationalStrategicCommandPriority.HIGH;
    if (score >= 40) return RelationalStrategicCommandPriority.MEDIUM;
    return RelationalStrategicCommandPriority.LOW;
  }

  toSeverity(urgency: number): RelationalStrategicCommandSeverity {
    if (urgency >= 78) return RelationalStrategicCommandSeverity.CRITICAL;
    if (urgency >= 58) return RelationalStrategicCommandSeverity.HIGH;
    if (urgency >= 38) return RelationalStrategicCommandSeverity.MEDIUM;
    return RelationalStrategicCommandSeverity.LOW;
  }
}
