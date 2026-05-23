import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { RelationalEconomicDependencyExposure } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { EconomicSovereigntyCorridorContext } from "./relational-economic-sovereignty-corridor-context.service";
import type { SovereigntyAutonomyScores } from "./relational-economic-sovereignty-autonomy.service";
import { RelationalEconomicSovereigntyCalibrationService } from "./relational-economic-sovereignty-calibration.service";

export type ComputedSovereigntyDependency = {
  dependencyConcentration: number;
  captivityTransferScore: number;
  autonomyRecoveryProbability: number;
  exposureLevel: RelationalEconomicDependencyExposure;
  diagnostics: Prisma.InputJsonValue;
};

@Injectable()
export class RelationalEconomicSovereigntyDependencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calibration: RelationalEconomicSovereigntyCalibrationService,
  ) {}

  computeCorridorDependency(input: {
    relationshipId: string;
    autonomy: SovereigntyAutonomyScores;
    ctx: EconomicSovereigntyCorridorContext;
  }): ComputedSovereigntyDependency {
    const { autonomy, ctx } = input;
    const dw = this.calibration.getCalibration().dependencyWeights;
    const concentration = autonomy.dependencyConcentration;
    const memoryBoost = Math.min(20, ctx.strategicMemoryActiveCount * 4);
    const dependencyConcentration = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          concentration * dw.concentrationBlend +
            ctx.macroDependencyCount * dw.macroDepBoost -
            memoryBoost * dw.memoryMitigation,
        ),
      ),
    );
    const captivityTransferScore = Math.min(
      100,
      Math.round(
        dependencyConcentration * dw.captivityFromConcentration +
          autonomy.strategicCaptivityRisk * dw.captivityFromStrategic,
      ),
    );
    const autonomyRecoveryProbability = Math.max(
      0.05,
      Math.min(0.95, autonomy.corridorSelfRecoveryProbability - dependencyConcentration / dw.recoveryPenaltyDivisor),
    );
    let exposureLevel = autonomy.dependencyExposureLevel;
    if (ctx.supplyFlowEdgeCount >= 4 && dependencyConcentration >= 55) {
      exposureLevel = RelationalEconomicDependencyExposure.SYSTEMIC;
    }

    return {
      dependencyConcentration,
      captivityTransferScore,
      autonomyRecoveryProbability,
      exposureLevel,
      diagnostics: {
        computedFrom: ["dependency_concentration", "macro_deps", "supply_edges", "memory", "captivity"],
        macroDependencyCount: ctx.macroDependencyCount,
        supplyFlowEdgeCount: ctx.supplyFlowEdgeCount,
        relationshipId: input.relationshipId,
        calibrationVersion: this.calibration.getCalibration().calibrationVersion,
        dependencyWeights: dw,
      },
    };
  }

  /** @deprecated use instance method — kept for tests */
  static computeCorridorDependency(input: {
    relationshipId: string;
    autonomy: SovereigntyAutonomyScores;
    ctx: EconomicSovereigntyCorridorContext;
  }): ComputedSovereigntyDependency {
    const cal = new RelationalEconomicSovereigntyCalibrationService();
    const dw = cal.getCalibration().dependencyWeights;
    const { autonomy, ctx } = input;
    const concentration = autonomy.dependencyConcentration;
    const memoryBoost = Math.min(20, ctx.strategicMemoryActiveCount * 4);
    const dependencyConcentration = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          concentration * dw.concentrationBlend +
            ctx.macroDependencyCount * dw.macroDepBoost -
            memoryBoost * dw.memoryMitigation,
        ),
      ),
    );
    const captivityTransferScore = Math.min(
      100,
      Math.round(
        dependencyConcentration * dw.captivityFromConcentration +
          autonomy.strategicCaptivityRisk * dw.captivityFromStrategic,
      ),
    );
    const autonomyRecoveryProbability = Math.max(
      0.05,
      Math.min(0.95, autonomy.corridorSelfRecoveryProbability - dependencyConcentration / dw.recoveryPenaltyDivisor),
    );
    let exposureLevel = autonomy.dependencyExposureLevel;
    if (ctx.supplyFlowEdgeCount >= 4 && dependencyConcentration >= 55) {
      exposureLevel = RelationalEconomicDependencyExposure.SYSTEMIC;
    }
    return {
      dependencyConcentration,
      captivityTransferScore,
      autonomyRecoveryProbability,
      exposureLevel,
      diagnostics: {
        computedFrom: ["dependency_concentration", "macro_deps", "supply_edges", "memory", "captivity"],
        macroDependencyCount: ctx.macroDependencyCount,
        supplyFlowEdgeCount: ctx.supplyFlowEdgeCount,
        relationshipId: input.relationshipId,
      },
    };
  }

  async persistAdaptiveDependency(
    primaryId: string,
    secondaryId: string,
    computed: ComputedSovereigntyDependency,
    relationshipId: string,
  ): Promise<void> {
    await this.prisma.relationalEconomicSovereigntyDependency.deleteMany({
      where: {
        OR: [
          { sourceSovereigntyNodeId: primaryId, targetSovereigntyNodeId: secondaryId },
          { sourceSovereigntyNodeId: secondaryId, targetSovereigntyNodeId: primaryId },
        ],
      },
    });
    await this.prisma.relationalEconomicSovereigntyDependency.create({
      data: {
        sourceSovereigntyNodeId: primaryId,
        targetSovereigntyNodeId: secondaryId,
        exposureLevel: computed.exposureLevel,
        dependencyConcentration: computed.dependencyConcentration,
        captivityTransferScore: computed.captivityTransferScore,
        autonomyRecoveryProbability: computed.autonomyRecoveryProbability,
        diagnostics: computed.diagnostics,
        metadata: { relationshipId, kind: "corridor_adaptive_pair" } as Prisma.InputJsonValue,
      },
    });
  }
}
