import { Injectable } from "@nestjs/common";
import { RelationalStrategicIntelligenceType } from "@prisma/client";

import type { StrategicIntelligenceCorridorContext } from "./relational-strategic-intelligence-corridor-context.service";

@Injectable()
export class RelationalStrategicIntelligenceBalanceService {
  resolveIntelligenceType(
    ctx: StrategicIntelligenceCorridorContext,
    systemicConcentration: number,
    executiveExposure: number,
  ): RelationalStrategicIntelligenceType {
    if (systemicConcentration >= 72) return RelationalStrategicIntelligenceType.NETWORK_SUPERVISION;
    if (executiveExposure >= 65 && ctx.topInstitutionalExecutiveRisk >= 60) {
      return RelationalStrategicIntelligenceType.EXECUTIVE_SYNTHESIS_DIGEST;
    }
    if (ctx.sectorSlug) return RelationalStrategicIntelligenceType.STRATEGIC_ALIGNMENT;
    return RelationalStrategicIntelligenceType.CONSOLIDATED_OVERVIEW;
  }
}
