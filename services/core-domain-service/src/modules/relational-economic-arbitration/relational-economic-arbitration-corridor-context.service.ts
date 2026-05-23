import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";
import {
  type EconomicGovernanceCorridorContext,
  RelationalEconomicGovernanceCorridorContextService,
} from "../relational-economic-governance/relational-economic-governance-corridor-context.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";

export type GovernanceConflictRef = {
  id: string;
  conflictCode: string;
  conflictType: string;
  conflictPressure: number;
  systemicExposure: number;
  recoveryImpact: number;
  estimatedResolutionComplexity: number;
  severity: string;
  priority: string;
};

export type EconomicArbitrationCorridorContext = EconomicGovernanceCorridorContext & {
  governanceConflictCount: number;
  topConflictPressure: number;
  activeGovernanceNodeId: string | null;
  activeRecoveryPlanId: string | null;
  governanceConflicts: GovernanceConflictRef[];
};

@Injectable()
export class RelationalEconomicArbitrationCorridorContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicArbitrationPolicyService,
    private readonly governanceContext: RelationalEconomicGovernanceCorridorContextService,
  ) {}

  async load(relationshipId: string): Promise<EconomicArbitrationCorridorContext> {
    const base = await this.governanceContext.load(relationshipId);
    if (!base.hasOrder) {
      return {
        ...base,
        governanceConflictCount: 0,
        topConflictPressure: 0,
        activeGovernanceNodeId: null,
        activeRecoveryPlanId: base.activeRecoveryPlanId,
        governanceConflicts: [],
      };
    }

    const [govNode, conflicts] = await Promise.all([
      this.prisma.relationalEconomicGovernanceNode.findFirst({
        where: { relationshipId, active: true },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      }),
      this.prisma.relationalEconomicGovernanceConflict.findMany({
        where: { relationshipId },
        orderBy: { conflictPressure: "desc" },
        take: 24,
        select: {
          id: true,
          conflictCode: true,
          conflictType: true,
          conflictPressure: true,
          systemicExposure: true,
          recoveryImpact: true,
          estimatedResolutionComplexity: true,
          severity: true,
          priority: true,
        },
      }),
    ]);

    const topConflictPressure =
      conflicts.length > 0 ? this.policy.clampInt(conflicts[0]!.conflictPressure) : 0;

    return {
      ...base,
      governanceConflictCount: conflicts.length,
      topConflictPressure,
      activeGovernanceNodeId: govNode?.id ?? null,
      activeRecoveryPlanId: base.activeRecoveryPlanId,
      governanceConflicts: conflicts,
    };
  }
}
