import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type EconomicRecoveryCorridorContext,
  RelationalEconomicRecoveryCorridorContextService,
} from "../relational-economic-recovery/relational-economic-recovery-corridor-context.service";
import { RelationalEconomicGovernancePolicyService } from "./relational-economic-governance-policy.service";

export type EconomicGovernanceCorridorContext = EconomicRecoveryCorridorContext & {
  activeRecoveryPlanId: string | null;
  activeRecoveryScore: number;
  activeRecoveryInstability: number;
  activeRecoveryInterventionPriority: number;
  dependencyNodeId: string | null;
  dependencyScore: number;
  pressureGraphScore: number;
  peerRelationshipCount: number;
  priorGovernanceNodeCount: number;
};

@Injectable()
export class RelationalEconomicGovernanceCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicGovernancePolicyService,
    private readonly recoveryContext: RelationalEconomicRecoveryCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<EconomicGovernanceCorridorContext> {
    const base = await this.recoveryContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        activeRecoveryPlanId: null,
        activeRecoveryScore: 0,
        activeRecoveryInstability: 0,
        activeRecoveryInterventionPriority: 0,
        dependencyNodeId: null,
        dependencyScore: 0,
        pressureGraphScore: 0,
        peerRelationshipCount: 0,
        priorGovernanceNodeCount: 0,
      };
    }

    const [recoveryPlan, depNode, peerCount, priorNodes] = await Promise.all([
      this.prisma.relationalEconomicRecoveryPlan.findFirst({
        where: { relationshipId, active: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          recoveryScore: true,
          instabilityScore: true,
          interventionPriority: true,
        },
      }),
      this.prisma.relationalEconomicDependencyNode.findUnique({
        where: { relationshipId },
        select: { id: true, dependencyScore: true, pressureScore: true },
      }),
      this.prisma.relationship.count({
        where: {
          OR: [
            { requesterOrganizationId: base.buyerOrganizationId! },
            { receiverOrganizationId: base.buyerOrganizationId! },
          ],
          id: { not: relationshipId },
          corridorState: { not: "TERMINATED" },
        },
      }),
      this.prisma.relationalEconomicGovernanceNode.count({ where: { relationshipId } }),
    ]);

    return {
      ...base,
      activeRecoveryPlanId: recoveryPlan?.id ?? null,
      activeRecoveryScore: recoveryPlan?.recoveryScore ?? 0,
      activeRecoveryInstability: recoveryPlan?.instabilityScore ?? 0,
      activeRecoveryInterventionPriority: recoveryPlan?.interventionPriority ?? 0,
      dependencyNodeId: depNode?.id ?? null,
      dependencyScore: depNode?.dependencyScore ?? base.dependencyExposureScore,
      pressureGraphScore: depNode?.pressureScore ?? base.pressureScore,
      peerRelationshipCount: this.policy.clampInt(peerCount, 0, 500),
      priorGovernanceNodeCount: priorNodes,
    };
  }
}
