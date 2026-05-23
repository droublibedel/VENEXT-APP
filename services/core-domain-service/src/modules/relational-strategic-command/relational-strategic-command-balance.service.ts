import { Injectable } from "@nestjs/common";
import { RelationalStrategicCommandType } from "@prisma/client";

import type { StrategicCommandCorridorContext } from "./relational-strategic-command-corridor-context.service";

@Injectable()
export class RelationalStrategicCommandBalanceService {
  resolveCommandType(
    ctx: StrategicCommandCorridorContext,
    systemicPressure: number,
    executiveConcentration: number,
  ): RelationalStrategicCommandType {
    if (systemicPressure >= 72) return RelationalStrategicCommandType.SYSTEMIC_GRID;
    if (executiveConcentration >= 65) return RelationalStrategicCommandType.EXECUTIVE_SUPERVISION;
    if (ctx.sectorSlug) return RelationalStrategicCommandType.NETWORK_OVERSIGHT;
    return RelationalStrategicCommandType.COMMAND_OVERVIEW;
  }
}
