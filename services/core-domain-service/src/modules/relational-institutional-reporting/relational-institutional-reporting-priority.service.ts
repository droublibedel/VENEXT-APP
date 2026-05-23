import { Injectable } from "@nestjs/common";
import {
  RelationalInstitutionalReportingPriority,
  RelationalInstitutionalReportingSeverity,
} from "@prisma/client";

import type { InstitutionalReportingCorridorContext } from "./relational-institutional-reporting-corridor-context.service";
import { RelationalInstitutionalReportingPolicyService } from "./relational-institutional-reporting-policy.service";

@Injectable()
export class RelationalInstitutionalReportingPriorityService {
  constructor(private readonly policy: RelationalInstitutionalReportingPolicyService) {}

  computeExecutiveUrgency(ctx: InstitutionalReportingCorridorContext): number {
    return this.policy.clampInt(
      ctx.topExecutiveCoordinationPressure * 0.35 +
        ctx.topOrchestrationScore * 0.2 +
        ctx.topExecutivePressure * 0.25 +
        ctx.topSystemicRisk * 0.2,
    );
  }

  toPriority(score: number): RelationalInstitutionalReportingPriority {
    if (score >= 80) return RelationalInstitutionalReportingPriority.CRITICAL;
    if (score >= 62) return RelationalInstitutionalReportingPriority.HIGH;
    if (score >= 40) return RelationalInstitutionalReportingPriority.MEDIUM;
    return RelationalInstitutionalReportingPriority.LOW;
  }

  toSeverity(urgency: number): RelationalInstitutionalReportingSeverity {
    if (urgency >= 78) return RelationalInstitutionalReportingSeverity.CRITICAL;
    if (urgency >= 58) return RelationalInstitutionalReportingSeverity.HIGH;
    if (urgency >= 38) return RelationalInstitutionalReportingSeverity.MEDIUM;
    return RelationalInstitutionalReportingSeverity.LOW;
  }
}
