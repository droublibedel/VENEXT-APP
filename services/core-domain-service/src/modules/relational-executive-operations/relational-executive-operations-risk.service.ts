import { Injectable } from "@nestjs/common";

import type { ExecutiveOperationsCorridorContext } from "./relational-executive-operations-corridor-context.service";
import { RelationalExecutiveOperationsPolicyService } from "./relational-executive-operations-policy.service";

@Injectable()
export class RelationalExecutiveOperationsRiskService {
  constructor(private readonly policy: RelationalExecutiveOperationsPolicyService) {}

  computeExecutivePressure(ctx: ExecutiveOperationsCorridorContext): number {
    return this.policy.clampInt(
      ctx.topCommandExecutiveConcentration * 0.35 +
        ctx.topCommandScore * 0.25 +
        ctx.topExecutivePressure * 0.25 +
        ctx.governanceConflictCount * 6,
    );
  }

  computeSystemicConcentration(ctx: ExecutiveOperationsCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicExecutiveConcentration * 0.35 +
        ctx.topSystemicRisk * 0.35 +
        ctx.peerRelationshipCount * 7 +
        ctx.macroPropagationRisk * 0.2,
    );
  }
}
