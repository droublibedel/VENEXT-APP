import { Injectable } from "@nestjs/common";
import { RelationalInstitutionalReportingType } from "@prisma/client";

import type { InstitutionalReportingCorridorContext } from "./relational-institutional-reporting-corridor-context.service";

@Injectable()
export class RelationalInstitutionalReportingBalanceService {
  resolveReportingType(
    ctx: InstitutionalReportingCorridorContext,
    systemicExposure: number,
    executiveRisk: number,
  ): RelationalInstitutionalReportingType {
    if (systemicExposure >= 72) return RelationalInstitutionalReportingType.STRATEGIC_INTELLIGENCE;
    if (executiveRisk >= 65 && ctx.topExecutiveCoordinationPressure >= 60) {
      return RelationalInstitutionalReportingType.EXECUTIVE_DIGEST;
    }
    if (ctx.sectorSlug) return RelationalInstitutionalReportingType.CORRIDOR_BRIEFING;
    return RelationalInstitutionalReportingType.INSTITUTIONAL_OVERVIEW;
  }
}
