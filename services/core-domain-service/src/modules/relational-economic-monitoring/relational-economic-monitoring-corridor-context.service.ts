import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type EconomicStabilizationCorridorContext,
  RelationalEconomicStabilizationCorridorContextService,
} from "../relational-economic-stabilization/relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";

export type EconomicMonitoringCorridorContext = EconomicStabilizationCorridorContext & {
  activeStabilizationNodeId: string | null;
  topStabilizationScore: number;
  topStabilizationUrgency: number;
  topInstabilityPressure: number;
  priorMonitoringNodeCount: number;
};

@Injectable()
export class RelationalEconomicMonitoringCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicMonitoringPolicyService,
    private readonly stabilizationContext: RelationalEconomicStabilizationCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<EconomicMonitoringCorridorContext> {
    const base = await this.stabilizationContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeStabilizationNodeId: null,
        topStabilizationScore: 0,
        topStabilizationUrgency: 0,
        topInstabilityPressure: 0,
        priorMonitoringNodeCount: 0,
      };
    }

    const [stabNode, priorCount] = await Promise.all([
      this.prisma.relationalEconomicStabilizationNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { stabilizationScore: "desc" },
        select: { id: true, stabilizationScore: true, stabilizationUrgency: true, instabilityPressure: true },
      }),
      this.prisma.relationalEconomicMonitoringNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeStabilizationNodeId: stabNode?.id ?? null,
      topStabilizationScore: this.policy.clampInt(stabNode?.stabilizationScore ?? 0),
      topStabilizationUrgency: this.policy.clampInt(stabNode?.stabilizationUrgency ?? 0),
      topInstabilityPressure: this.policy.clampInt(stabNode?.instabilityPressure ?? 0),
      priorMonitoringNodeCount: priorCount,
    };
  }
}
