import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalEconomicInstabilityType } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { EconomicContinuityCorridorContext } from "./relational-economic-continuity-corridor-context.service";
import type { ContinuityStabilityScores } from "./relational-economic-continuity-stability.service";
import { RelationalEconomicContinuityPolicyService } from "./relational-economic-continuity-policy.service";

export type ComputedContinuityDependency = {
  dependencyDurability: number;
  continuityTransferScore: number;
  recoveryPropagationProbability: number;
  instabilityType: RelationalEconomicInstabilityType;
  diagnostics: Prisma.InputJsonValue;
};

@Injectable()
export class RelationalEconomicContinuityDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicContinuityPolicyService,
  ) {}

  static computeCorridorDependency(input: {
    relationshipId: string;
    stability: ContinuityStabilityScores;
    ctx: EconomicContinuityCorridorContext;
  }): ComputedContinuityDependency {
    const { stability, ctx } = input;
    const durabilityBase = stability.dependencyDurability;
    const instabilityWeight = stability.instabilityRisk;
    const macroWeight = ctx.macroStructuralFragility;
    const memoryWeight = Math.min(100, ctx.strategicMemoryActiveCount * 7);
    const propagationWeight = Math.min(100, ctx.macroPropagationEventCount * 5);
    const trendWeight = ctx.snapshotResilienceTrend < 0 ? Math.min(30, Math.abs(ctx.snapshotResilienceTrend)) : 0;

    const dependencyDurability = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          durabilityBase * 0.42 +
            memoryWeight * 0.18 +
            (100 - instabilityWeight) * 0.2 +
            (100 - macroWeight) * 0.12 +
            (100 - propagationWeight) * 0.08,
        ),
      ),
    );
    const continuityTransferScore = Math.min(
      100,
      Math.round(dependencyDurability * 0.7 + instabilityWeight * 0.3),
    );
    const recoveryPropagationProbability = Math.max(
      0.05,
      Math.min(0.95, dependencyDurability / 100 - trendWeight / 200 + 0.05),
    );

    let instabilityType: RelationalEconomicInstabilityType =
      RelationalEconomicInstabilityType.CORRIDOR_INSTABILITY;
    if (ctx.sectorNodeId) instabilityType = RelationalEconomicInstabilityType.SECTOR_DRIFT;
    if (ctx.geoZoneId && !ctx.sectorNodeId) {
      instabilityType = RelationalEconomicInstabilityType.TERRITORY_VULNERABILITY;
    }
    if (ctx.primaryMacroNodeId && stability.systemicContinuityRisk >= 60) {
      instabilityType = RelationalEconomicInstabilityType.MACRO_DECOUPLING;
    }
    if (ctx.supplyFlowDisruptionAvg >= 55) {
      instabilityType = RelationalEconomicInstabilityType.SUPPLY_DISRUPTION;
    }
    if (ctx.macroPropagationEventCount >= 3) {
      instabilityType = RelationalEconomicInstabilityType.DEPENDENCY_CONCENTRATION;
    }
    if (ctx.snapshotResilienceTrend <= -8) {
      instabilityType = RelationalEconomicInstabilityType.TEMPORAL_DECAY;
    }

    return {
      dependencyDurability,
      continuityTransferScore,
      recoveryPropagationProbability,
      instabilityType,
      diagnostics: {
        computedFrom: [
          "dependency_durability",
          "instability_risk",
          "macro_structural",
          "strategic_memory",
          "propagation_history",
          "snapshot_trend",
        ],
        durabilityBase,
        instabilityWeight,
        macroWeight,
        memoryWeight,
        propagationWeight,
        trendWeight,
        relationshipId: input.relationshipId,
      },
    };
  }

  async persistAdaptiveDependency(
    primaryContinuityNodeId: string,
    secondaryContinuityNodeId: string,
    computed: ComputedContinuityDependency,
    relationshipId: string,
  ): Promise<void> {
    await this.prisma.relationalEconomicContinuityDependency.deleteMany({
      where: {
        OR: [
          { sourceContinuityNodeId: primaryContinuityNodeId, targetContinuityNodeId: secondaryContinuityNodeId },
          { sourceContinuityNodeId: secondaryContinuityNodeId, targetContinuityNodeId: primaryContinuityNodeId },
        ],
      },
    });
    await this.prisma.relationalEconomicContinuityDependency.create({
      data: {
        sourceContinuityNodeId: primaryContinuityNodeId,
        targetContinuityNodeId: secondaryContinuityNodeId,
        instabilityType: computed.instabilityType,
        dependencyDurability: computed.dependencyDurability,
        continuityTransferScore: computed.continuityTransferScore,
        recoveryPropagationProbability: computed.recoveryPropagationProbability,
        diagnostics: computed.diagnostics,
        metadata: { relationshipId, kind: "corridor_adaptive_pair" } as Prisma.InputJsonValue,
      },
    });
  }
}
