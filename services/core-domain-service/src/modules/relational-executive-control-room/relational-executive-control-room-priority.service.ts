import { Injectable } from "@nestjs/common";
import {
  RelationalExecutiveControlRoomPriority,
  RelationalExecutiveControlRoomSeverity,
} from "@prisma/client";

import type { ExecutiveControlRoomCorridorContext } from "./relational-executive-control-room-corridor-context.service";
import { RelationalExecutiveControlRoomPolicyService } from "./relational-executive-control-room-policy.service";

@Injectable()
export class RelationalExecutiveControlRoomPriorityService {
  constructor(private readonly policy: RelationalExecutiveControlRoomPolicyService) {}

  computeExecutiveUrgency(ctx: ExecutiveControlRoomCorridorContext): number {
    return this.policy.clampInt(
      ctx.topOperationsExecutivePressure * 0.35 +
        ctx.topOperationsScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalExecutiveControlRoomPriority {
    if (score >= 80) return RelationalExecutiveControlRoomPriority.CRITICAL;
    if (score >= 62) return RelationalExecutiveControlRoomPriority.HIGH;
    if (score >= 40) return RelationalExecutiveControlRoomPriority.MEDIUM;
    return RelationalExecutiveControlRoomPriority.LOW;
  }

  toSeverity(urgency: number): RelationalExecutiveControlRoomSeverity {
    if (urgency >= 78) return RelationalExecutiveControlRoomSeverity.CRITICAL;
    if (urgency >= 58) return RelationalExecutiveControlRoomSeverity.HIGH;
    if (urgency >= 38) return RelationalExecutiveControlRoomSeverity.MEDIUM;
    return RelationalExecutiveControlRoomSeverity.LOW;
  }
}
