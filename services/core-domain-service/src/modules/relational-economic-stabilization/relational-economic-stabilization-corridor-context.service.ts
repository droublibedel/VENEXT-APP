import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type EconomicArbitrationCorridorContext,
  RelationalEconomicArbitrationCorridorContextService,
} from "../relational-economic-arbitration/relational-economic-arbitration-corridor-context.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";

export type EconomicStabilizationCorridorContext = EconomicArbitrationCorridorContext & {
  activeArbitrationCaseId: string | null;
  topArbitrationScore: number;
  topArbitrationUrgency: number;
  activeGovernanceScore: number;
  activeGovernanceStability: number;
  priorStabilizationNodeCount: number;
};

@Injectable()
export class RelationalEconomicStabilizationCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicStabilizationPolicyService,
    private readonly arbitrationContext: RelationalEconomicArbitrationCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<EconomicStabilizationCorridorContext> {
    const base = await this.arbitrationContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeArbitrationCaseId: null,
        topArbitrationScore: 0,
        topArbitrationUrgency: 0,
        activeGovernanceScore: 0,
        activeGovernanceStability: 0,
        priorStabilizationNodeCount: 0,
      };
    }

    const [arbCase, govNode, priorCount] = await Promise.all([
      this.prisma.relationalEconomicArbitrationCase.findFirst({
        where: { relationshipId, active: true },
        orderBy: { arbitrationScore: "desc" },
        select: { id: true, arbitrationScore: true, interventionUrgency: true },
      }),
      base.activeGovernanceNodeId
        ? this.prisma.relationalEconomicGovernanceNode.findUnique({
            where: { id: base.activeGovernanceNodeId },
            select: { governanceScore: true, governanceStability: true },
          })
        : this.prisma.relationalEconomicGovernanceNode.findFirst({
            where: { relationshipId, active: true },
            orderBy: { createdAt: "desc" },
            select: { governanceScore: true, governanceStability: true },
          }),
      this.prisma.relationalEconomicStabilizationNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeArbitrationCaseId: arbCase?.id ?? null,
      topArbitrationScore: this.policy.clampInt(arbCase?.arbitrationScore ?? 0),
      topArbitrationUrgency: this.policy.clampInt(arbCase?.interventionUrgency ?? 0),
      activeGovernanceScore: this.policy.clampInt(govNode?.governanceScore ?? 0),
      activeGovernanceStability: this.policy.clampInt(govNode?.governanceStability ?? 0),
      priorStabilizationNodeCount: priorCount,
    };
  }
}
