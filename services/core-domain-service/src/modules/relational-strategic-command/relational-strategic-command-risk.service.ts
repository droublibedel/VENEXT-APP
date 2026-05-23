import { Injectable } from "@nestjs/common";

import type { StrategicCommandCorridorContext } from "./relational-strategic-command-corridor-context.service";
import { RelationalStrategicCommandPolicyService } from "./relational-strategic-command-policy.service";

@Injectable()
export class RelationalStrategicCommandRiskService {
  constructor(private readonly policy: RelationalStrategicCommandPolicyService) {}

  computeSystemicPressure(ctx: StrategicCommandCorridorContext): number {
    return this.policy.clampInt(
      ctx.topSystemicRisk * 0.4 +
        ctx.macroPropagationRisk * 0.25 +
        ctx.peerRelationshipCount * 8 +
        ctx.governanceConflictCount * 5,
    );
  }

  computeExecutiveConcentration(ctx: StrategicCommandCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicExecutiveConcentration * 0.45 +
        ctx.topExecutiveCoordinationPressure * 0.3 +
        ctx.governanceConflictCount * 8,
    );
  }
}
