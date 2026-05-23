import { Injectable } from "@nestjs/common";

import type { ExecutiveStrategicSynthesisCorridorContext } from "./relational-executive-strategic-synthesis-corridor-context.service";
import { RelationalExecutiveStrategicSynthesisPolicyService } from "./relational-executive-strategic-synthesis-policy.service";

@Injectable()
export class RelationalExecutiveStrategicSynthesisRiskService {
  constructor(private readonly policy: RelationalExecutiveStrategicSynthesisPolicyService) {}

  computeExecutiveExposure(ctx: ExecutiveStrategicSynthesisCorridorContext): number {
    return this.policy.clampInt(
      ctx.topControlRoomExecutivePressure * 0.35 +
        ctx.topControlRoomScore * 0.25 +
        ctx.topOperationsExecutivePressure * 0.2 +
        ctx.governanceConflictCount * 6,
    );
  }

  computeSystemicPressure(ctx: ExecutiveStrategicSynthesisCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicExecutiveConcentration * 0.3 +
        ctx.topSystemicRisk * 0.35 +
        ctx.peerRelationshipCount * 7 +
        ctx.macroPropagationRisk * 0.2,
    );
  }
}
