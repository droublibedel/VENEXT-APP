import { Injectable } from "@nestjs/common";
import { RelationalGlobalExecutiveSupervisionType } from "@prisma/client";

import type { GlobalExecutiveSupervisionCorridorContext } from "./relational-global-executive-supervision-corridor-context.service";

@Injectable()
export class RelationalGlobalExecutiveSupervisionBalanceService {
  resolveSupervisionType(
    ctx: GlobalExecutiveSupervisionCorridorContext,
    executivePressure: number,
    systemicExposure: number,
  ): RelationalGlobalExecutiveSupervisionType {
    if (executivePressure >= 72) return RelationalGlobalExecutiveSupervisionType.SYSTEMIC_EXPOSURE;
    if (systemicExposure >= 65) return RelationalGlobalExecutiveSupervisionType.GLOBAL_EXECUTIVE_CONSOLIDATION;
    if (ctx.sectorSlug) return RelationalGlobalExecutiveSupervisionType.NETWORK_SUPERVISION;
    return RelationalGlobalExecutiveSupervisionType.SUPERVISION_OVERVIEW;
  }
}
