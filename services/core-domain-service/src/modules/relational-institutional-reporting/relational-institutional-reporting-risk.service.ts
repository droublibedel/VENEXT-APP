import { Injectable } from "@nestjs/common";

import type { InstitutionalReportingCorridorContext } from "./relational-institutional-reporting-corridor-context.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";

@Injectable()
export class RelationalInstitutionalReportingRiskService {
  constructor(private readonly policy: RelationalInstitutionalReportingPolicyService) {}

  computeSystemicExposure(ctx: InstitutionalReportingCorridorContext): number {
    return this.policy.clampInt(
      ctx.topSystemicRisk * 0.4 +
        ctx.macroPropagationRisk * 0.25 +
        ctx.peerRelationshipCount * 8 +
        ctx.governanceConflictCount * 5,
    );
  }

  computeExecutiveRisk(ctx: InstitutionalReportingCorridorContext): number {
    return this.policy.clampInt(
      ctx.topExecutiveCoordinationPressure * 0.4 +
        ctx.topOrchestrationScore * 0.15 +
        ctx.governanceConflictCount * 8 +
        ctx.topExecutivePressure * 0.25,
    );
  }
}
