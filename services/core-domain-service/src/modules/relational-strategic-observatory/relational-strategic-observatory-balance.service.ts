import { Injectable } from "@nestjs/common";
import { RelationalStrategicObservatoryType } from "@prisma/client";

import type { StrategicObservatoryCorridorContext } from "./relational-strategic-observatory-corridor-context.service";

@Injectable()
export class RelationalStrategicObservatoryBalanceService {
  resolveObservatoryType(
    ctx: StrategicObservatoryCorridorContext,
    executiveExposure: number,
    systemicPressure: number,
  ): RelationalStrategicObservatoryType {
    if (executiveExposure >= 72) return RelationalStrategicObservatoryType.SYSTEMIC_CONCENTRATION;
    if (systemicPressure >= 65) return RelationalStrategicObservatoryType.MACRO_COORDINATION;
    if (ctx.sectorSlug) return RelationalStrategicObservatoryType.NETWORK_COORDINATION;
    return RelationalStrategicObservatoryType.OBSERVATORY_OVERVIEW;
  }
}
