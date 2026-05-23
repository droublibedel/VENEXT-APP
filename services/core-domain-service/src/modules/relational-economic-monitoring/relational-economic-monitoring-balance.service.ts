import { Injectable } from "@nestjs/common";
import { RelationalEconomicMonitoringType } from "@prisma/client";

import type { EconomicMonitoringCorridorContext } from "./relational-economic-monitoring-corridor-context.service";

@Injectable()
export class RelationalEconomicMonitoringBalanceService {
  resolveMonitoringType(
    ctx: EconomicMonitoringCorridorContext,
    systemicRisk: number,
    executivePressure: number,
  ): RelationalEconomicMonitoringType {
    if (systemicRisk >= 72) return RelationalEconomicMonitoringType.SYSTEMIC_OVERSIGHT;
    if (executivePressure >= 65 && ctx.topInstabilityPressure >= 60) {
      return RelationalEconomicMonitoringType.CRITICAL_CORRIDOR_WATCH;
    }
    if (ctx.peerRelationshipCount >= 3) return RelationalEconomicMonitoringType.STRATEGIC_BALANCE;
    return RelationalEconomicMonitoringType.EXECUTIVE_SUPERVISION;
  }
}
