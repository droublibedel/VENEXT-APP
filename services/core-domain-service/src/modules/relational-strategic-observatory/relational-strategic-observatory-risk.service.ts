import { Injectable } from "@nestjs/common";

import type { StrategicObservatoryCorridorContext } from "./relational-strategic-observatory-corridor-context.service";
import { RelationalStrategicObservatoryPolicyService } from "./relational-strategic-observatory-policy.service";

@Injectable()
export class RelationalStrategicObservatoryRiskService {
  constructor(private readonly policy: RelationalStrategicObservatoryPolicyService) {}

  computeExecutiveExposure(ctx: StrategicObservatoryCorridorContext): number {
    return this.policy.clampInt(
      ctx.topControlRoomExecutivePressure * 0.35 +
        ctx.topControlRoomScore * 0.25 +
        ctx.topOperationsExecutivePressure * 0.2 +
        ctx.governanceConflictCount * 6,
    );
  }

  computeSystemicPressure(ctx: StrategicObservatoryCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicExecutiveConcentration * 0.3 +
        ctx.topSystemicRisk * 0.35 +
        ctx.peerRelationshipCount * 7 +
        ctx.macroPropagationRisk * 0.2,
    );
  }
}
