import { Injectable } from "@nestjs/common";

import type { GlobalExecutiveSupervisionCorridorContext } from "./relational-global-executive-supervision-corridor-context.service";
import { RelationalGlobalExecutiveSupervisionPolicyService } from "./relational-global-executive-supervision-policy.service";

@Injectable()
export class RelationalGlobalExecutiveSupervisionRiskService {
  constructor(private readonly policy: RelationalGlobalExecutiveSupervisionPolicyService) {}

  computeExecutivePressure(ctx: GlobalExecutiveSupervisionCorridorContext): number {
    return this.policy.clampInt(
      ctx.topControlRoomExecutivePressure * 0.35 +
        ctx.topControlRoomScore * 0.25 +
        ctx.topOperationsExecutivePressure * 0.2 +
        ctx.governanceConflictCount * 6,
    );
  }

  computeSystemicExposure(ctx: GlobalExecutiveSupervisionCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicExecutiveConcentration * 0.3 +
        ctx.topSystemicRisk * 0.35 +
        ctx.peerRelationshipCount * 7 +
        ctx.macroPropagationRisk * 0.2,
    );
  }
}
