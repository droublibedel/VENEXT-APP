import { Injectable } from "@nestjs/common";

import type { ExecutiveControlRoomCorridorContext } from "./relational-executive-control-room-corridor-context.service";
import { RelationalExecutiveControlRoomPolicyService } from "./relational-executive-control-room-policy.service";

@Injectable()
export class RelationalExecutiveControlRoomRiskService {
  constructor(private readonly policy: RelationalExecutiveControlRoomPolicyService) {}

  computeExecutivePressure(ctx: ExecutiveControlRoomCorridorContext): number {
    return this.policy.clampInt(
      ctx.topOperationsExecutivePressure * 0.35 +
        ctx.topOperationsScore * 0.25 +
        ctx.topCommandExecutiveConcentration * 0.2 +
        ctx.governanceConflictCount * 6,
    );
  }

  computeSystemicConcentration(ctx: ExecutiveControlRoomCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicExecutiveConcentration * 0.3 +
        ctx.topSystemicRisk * 0.35 +
        ctx.peerRelationshipCount * 7 +
        ctx.macroPropagationRisk * 0.2,
    );
  }
}
