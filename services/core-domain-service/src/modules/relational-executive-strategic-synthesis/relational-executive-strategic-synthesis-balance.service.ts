import { Injectable } from "@nestjs/common";
import { RelationalExecutiveStrategicSynthesisType } from "@prisma/client";

import type { ExecutiveStrategicSynthesisCorridorContext } from "./relational-executive-strategic-synthesis-corridor-context.service";

@Injectable()
export class RelationalExecutiveStrategicSynthesisBalanceService {
  resolveSynthesisType(
    ctx: ExecutiveStrategicSynthesisCorridorContext,
    executiveExposure: number,
    systemicPressure: number,
  ): RelationalExecutiveStrategicSynthesisType {
    if (executiveExposure >= 72) return RelationalExecutiveStrategicSynthesisType.SYSTEMIC_PRESSURE;
    if (systemicPressure >= 65) return RelationalExecutiveStrategicSynthesisType.EXECUTIVE_CONSOLIDATION;
    if (ctx.sectorSlug) return RelationalExecutiveStrategicSynthesisType.NETWORK_OVERSIGHT;
    return RelationalExecutiveStrategicSynthesisType.SYNTHESIS_OVERVIEW;
  }
}
