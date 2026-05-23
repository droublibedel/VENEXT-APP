import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type EconomicMonitoringCorridorContext,
  RelationalEconomicMonitoringCorridorContextService,
} from "../relational-economic-monitoring/relational-economic-monitoring-corridor-context.service";
import { RelationalExecutiveOrchestrationPolicyService } from "./relational-executive-orchestration-policy.service";

export type ExecutiveOrchestrationCorridorContext = EconomicMonitoringCorridorContext & {
  activeMonitoringNodeId: string | null;
  topMonitoringScore: number;
  topExecutivePressure: number;
  topSystemicRisk: number;
  priorExecutiveOrchestrationNodeCount: number;
};

@Injectable()
export class RelationalExecutiveOrchestrationCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalExecutiveOrchestrationPolicyService,
    private readonly monitoringContext: RelationalEconomicMonitoringCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<ExecutiveOrchestrationCorridorContext> {
    const base = await this.monitoringContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeMonitoringNodeId: null,
        topMonitoringScore: 0,
        topExecutivePressure: 0,
        topSystemicRisk: 0,
        priorExecutiveOrchestrationNodeCount: 0,
      };
    }

    const [monNode, priorCount] = await Promise.all([
      this.prisma.relationalEconomicMonitoringNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { monitoringScore: "desc" },
        select: { id: true, monitoringScore: true, executivePressure: true, systemicRisk: true },
      }),
      this.prisma.relationalExecutiveOrchestrationNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeMonitoringNodeId: monNode?.id ?? null,
      topMonitoringScore: this.policy.clampInt(monNode?.monitoringScore ?? 0),
      topExecutivePressure: this.policy.clampInt(monNode?.executivePressure ?? 0),
      topSystemicRisk: this.policy.clampInt(monNode?.systemicRisk ?? 0),
      priorExecutiveOrchestrationNodeCount: priorCount,
    };
  }
}
