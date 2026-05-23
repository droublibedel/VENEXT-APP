import { Injectable } from "@nestjs/common";
import { RelationalExecutiveOperationsType } from "@prisma/client";

import type { ExecutiveOperationsCorridorContext } from "./relational-executive-operations-corridor-context.service";

@Injectable()
export class RelationalExecutiveOperationsBalanceService {
  resolveOperationsType(
    ctx: ExecutiveOperationsCorridorContext,
    executivePressure: number,
    systemicConcentration: number,
  ): RelationalExecutiveOperationsType {
    if (executivePressure >= 72) return RelationalExecutiveOperationsType.SYSTEMIC_MATRIX;
    if (systemicConcentration >= 65) return RelationalExecutiveOperationsType.EXECUTIVE_SUPERVISION;
    if (ctx.sectorSlug) return RelationalExecutiveOperationsType.NETWORK_OVERSIGHT;
    return RelationalExecutiveOperationsType.OPERATIONS_OVERVIEW;
  }
}
