import { Injectable } from "@nestjs/common";

import type { ExecutiveOrchestrationCorridorContext } from "./relational-executive-orchestration-corridor-context.service";
import { RelationalExecutiveOrchestrationPolicyService } from "./relational-executive-orchestration-policy.service";

@Injectable()
export class RelationalExecutiveOrchestrationRiskService {
  constructor(private readonly policy: RelationalExecutiveOrchestrationPolicyService) {}

  computeSystemicExposure(ctx: ExecutiveOrchestrationCorridorContext): number {
    return this.policy.clampInt(
      ctx.topSystemicRisk * 0.4 +
        ctx.macroPropagationRisk * 0.25 +
        ctx.peerRelationshipCount * 8 +
        ctx.governanceConflictCount * 6,
    );
  }
}
