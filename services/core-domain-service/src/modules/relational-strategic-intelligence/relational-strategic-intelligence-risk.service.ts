import { Injectable } from "@nestjs/common";

import type { StrategicIntelligenceCorridorContext } from "./relational-strategic-intelligence-corridor-context.service";
import { RelationalStrategicIntelligencePolicyService } from "./relational-strategic-intelligence-policy.service";

@Injectable()
export class RelationalStrategicIntelligenceRiskService {
  constructor(private readonly policy: RelationalStrategicIntelligencePolicyService) {}

  computeSystemicConcentration(ctx: StrategicIntelligenceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topSystemicRisk * 0.4 +
        ctx.macroPropagationRisk * 0.25 +
        ctx.peerRelationshipCount * 8 +
        ctx.governanceConflictCount * 5,
    );
  }

  computeExecutiveExposure(ctx: StrategicIntelligenceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topInstitutionalExecutiveRisk * 0.4 +
        ctx.topInstitutionalScore * 0.15 +
        ctx.governanceConflictCount * 8 +
        ctx.topExecutivePressure * 0.25,
    );
  }
}
