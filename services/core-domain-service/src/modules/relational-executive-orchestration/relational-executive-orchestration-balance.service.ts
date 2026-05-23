import { Injectable } from "@nestjs/common";
import { RelationalExecutiveOrchestrationType } from "@prisma/client";

import type { ExecutiveOrchestrationCorridorContext } from "./relational-executive-orchestration-corridor-context.service";

@Injectable()
export class RelationalExecutiveOrchestrationBalanceService {
  resolveOrchestrationType(
    ctx: ExecutiveOrchestrationCorridorContext,
    systemicExposure: number,
    coordinationPressure: number,
  ): RelationalExecutiveOrchestrationType {
    if (systemicExposure >= 72) return RelationalExecutiveOrchestrationType.SYSTEMIC_COORDINATION;
    if (coordinationPressure >= 65 && ctx.topInstabilityPressure >= 60) {
      return RelationalExecutiveOrchestrationType.CRITICAL_CORRIDOR_ORCHESTRATION;
    }
    if (ctx.peerRelationshipCount >= 3) return RelationalExecutiveOrchestrationType.STRATEGIC_ALIGNMENT;
    return RelationalExecutiveOrchestrationType.EXECUTIVE_MATRIX;
  }
}
