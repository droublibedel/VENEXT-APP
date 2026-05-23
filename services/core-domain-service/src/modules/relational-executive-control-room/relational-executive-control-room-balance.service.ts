import { Injectable } from "@nestjs/common";
import { RelationalExecutiveControlRoomType } from "@prisma/client";

import type { ExecutiveControlRoomCorridorContext } from "./relational-executive-control-room-corridor-context.service";

@Injectable()
export class RelationalExecutiveControlRoomBalanceService {
  resolveControlRoomType(
    ctx: ExecutiveControlRoomCorridorContext,
    executivePressure: number,
    systemicConcentration: number,
  ): RelationalExecutiveControlRoomType {
    if (executivePressure >= 72) return RelationalExecutiveControlRoomType.SYSTEMIC_BOARD;
    if (systemicConcentration >= 65) return RelationalExecutiveControlRoomType.EXECUTIVE_SUPERVISION;
    if (ctx.sectorSlug) return RelationalExecutiveControlRoomType.NETWORK_OVERSIGHT;
    return RelationalExecutiveControlRoomType.CONTROL_ROOM_OVERVIEW;
  }
}
