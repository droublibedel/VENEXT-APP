import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { GeneratedRecoveryStep } from "./relational-economic-recovery-planning.service";

@Injectable()
export class RelationalEconomicRecoveryStepService {
  constructor(private readonly prisma: PrismaService) {}

  async replacePlanSteps(recoveryPlanId: string, steps: GeneratedRecoveryStep[]): Promise<void> {
    await this.prisma.relationalEconomicRecoveryStep.deleteMany({ where: { recoveryPlanId } });
    if (steps.length === 0) return;
    await this.prisma.relationalEconomicRecoveryStep.createMany({
      data: steps.map((s) => ({
        recoveryPlanId,
        stepCode: s.stepCode,
        stepOrder: s.stepOrder,
        stepType: s.stepType,
        blocking: s.blocking,
        estimatedDuration: s.estimatedDuration,
        dependencyLevel: s.dependencyLevel,
        recoveryImpactScore: s.recoveryImpactScore,
        recoveryRiskScore: s.recoveryRiskScore,
        confidenceLevel: s.confidenceLevel,
        diagnostics: { planningOnly: true, nonAutopilot: true } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      })),
    });
  }
}
