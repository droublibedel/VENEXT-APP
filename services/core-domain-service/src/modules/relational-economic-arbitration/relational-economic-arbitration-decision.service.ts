import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  RelationalEconomicArbitrationDecisionType,
  RelationalEconomicArbitrationEventType,
  RelationalEconomicArbitrationScenarioType,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import type { GeneratedArbitrationScenario } from "./relational-economic-arbitration-scenario.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";

@Injectable()
export class RelationalEconomicArbitrationDecisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalEconomicArbitrationPolicyService,
  ) {}

  compareScenarios(scenarios: GeneratedArbitrationScenario[]): GeneratedArbitrationScenario | null {
    if (scenarios.length === 0) return null;
    return [...scenarios].sort(
      (a, b) =>
        b.estimatedRecoveryGain - a.estimatedRecoveryGain + (a.estimatedRisk - b.estimatedRisk) * 0.3,
    )[0]!;
  }

  computeDecisionConfidence(
    selected: GeneratedArbitrationScenario,
    rejected: GeneratedArbitrationScenario[],
  ): number {
    const gap =
      rejected.length > 0
        ? selected.estimatedRecoveryGain -
          Math.max(...rejected.map((r) => r.estimatedRecoveryGain))
        : selected.estimatedRecoveryGain;
    return this.policy.clampInt(50 + gap * 0.4 + (selected.confidenceLevel === "HIGH" ? 15 : 0));
  }

  async createDecision(input: {
    arbitrationCaseId: string;
    relationshipId: string;
    actorOrganizationId: string;
    selectedScenario: GeneratedArbitrationScenario;
    allScenarios: GeneratedArbitrationScenario[];
    arbitrationReason: string;
  }): Promise<{ decisionId: string; dualValidationRequired: boolean }> {
    const rejected = input.allScenarios.filter(
      (s) => s.scenarioType !== input.selectedScenario.scenarioType,
    );
    const dualValidationRequired = this.policy.requiresDualValidation(input.selectedScenario.scenarioType);
    const confidence = this.computeDecisionConfidence(input.selectedScenario, rejected);

    const scenarioRow = await this.prisma.relationalEconomicArbitrationScenario.findFirst({
      where: { scenarioCode: input.selectedScenario.scenarioCode },
      select: { id: true },
    });

    const decisionCode = `ARB_DECISION:${input.relationshipId}:${Date.now()}`;
    const decision = await this.prisma.relationalEconomicArbitrationDecision.create({
      data: {
        arbitrationCaseId: input.arbitrationCaseId,
        relationshipId: input.relationshipId,
        selectedScenarioId: scenarioRow?.id ?? null,
        decisionCode,
        decisionType: RelationalEconomicArbitrationDecisionType.PENDING,
        arbitrationReason: input.arbitrationReason.slice(0, 2000),
        rejectedScenarioIds: rejected.map((r) => r.scenarioCode) as Prisma.InputJsonValue,
        systemicTradeoffs: {
          confidence,
          selectedType: input.selectedScenario.scenarioType,
          dualValidationRequired,
        } as Prisma.InputJsonValue,
        expectedRecoveryGain: input.selectedScenario.estimatedRecoveryGain,
        expectedStabilityGain: this.policy.clampInt(
          input.selectedScenario.estimatedImpact * 0.6,
        ),
        validationRequired: true,
        dualValidationRequired,
        actorOrganizationId: input.actorOrganizationId,
        diagnostics: { planningOnly: true, nonAutopilot: true } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });

    await this.prisma.relationalEconomicArbitrationEvent.create({
      data: {
        relationshipId: input.relationshipId,
        arbitrationCaseId: input.arbitrationCaseId,
        eventType: RelationalEconomicArbitrationEventType.DECISION_CREATED,
        actorOrganizationId: input.actorOrganizationId,
        diagnostics: { decisionCode, decisionId: decision.id } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });

    return { decisionId: decision.id, dualValidationRequired };
  }

  async validateDecision(decisionId: string, actorOrganizationId: string): Promise<void> {
    const decision = await this.prisma.relationalEconomicArbitrationDecision.findUnique({
      where: { id: decisionId },
      include: {
        selectedScenario: { select: { scenarioType: true } },
        arbitrationCase: { include: { relationship: { select: { corridorState: true, id: true } } } },
      },
    });
    if (!decision) return;
    if (decision.decisionType === RelationalEconomicArbitrationDecisionType.VALIDATED) return;

    if (
      decision.dualValidationRequired &&
      decision.selectedScenario &&
      this.policy.requiresDualValidation(decision.selectedScenario.scenarioType)
    ) {
      const priorValidations = await this.prisma.relationalEconomicArbitrationEvent.count({
        where: {
          arbitrationCaseId: decision.arbitrationCaseId,
          eventType: RelationalEconomicArbitrationEventType.DECISION_VALIDATED,
        },
      });
      if (priorValidations === 0) {
        await this.prisma.relationalEconomicArbitrationEvent.create({
          data: {
            relationshipId: decision.relationshipId,
            arbitrationCaseId: decision.arbitrationCaseId,
            eventType: RelationalEconomicArbitrationEventType.DECISION_VALIDATED,
            actorOrganizationId,
            diagnostics: {
              decisionId,
              dualValidationPass: "first_approval_pending_second",
            } as Prisma.InputJsonValue,
            metadata: {} as Prisma.InputJsonValue,
          },
        });
        return;
      }
    }

    await this.prisma.relationalEconomicArbitrationDecision.update({
      where: { id: decisionId },
      data: {
        decisionType: RelationalEconomicArbitrationDecisionType.VALIDATED,
        validatedAt: new Date(),
      },
    });
    await this.prisma.relationalEconomicArbitrationEvent.create({
      data: {
        relationshipId: decision.relationshipId,
        arbitrationCaseId: decision.arbitrationCaseId,
        eventType: RelationalEconomicArbitrationEventType.DECISION_VALIDATED,
        actorOrganizationId,
        diagnostics: { decisionId } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }

  async rejectDecision(decisionId: string, actorOrganizationId: string, reason: string): Promise<void> {
    const decision = await this.prisma.relationalEconomicArbitrationDecision.findUnique({
      where: { id: decisionId },
    });
    if (!decision) return;
    await this.prisma.relationalEconomicArbitrationDecision.update({
      where: { id: decisionId },
      data: {
        decisionType: RelationalEconomicArbitrationDecisionType.REJECTED,
        rejectedAt: new Date(),
        arbitrationReason: reason.slice(0, 2000),
      },
    });
    await this.prisma.relationalEconomicArbitrationEvent.create({
      data: {
        relationshipId: decision.relationshipId,
        arbitrationCaseId: decision.arbitrationCaseId,
        eventType: RelationalEconomicArbitrationEventType.DECISION_REJECTED,
        actorOrganizationId,
        diagnostics: { decisionId, reason } as Prisma.InputJsonValue,
        metadata: {} as Prisma.InputJsonValue,
      },
    });
  }

  async archiveDecision(decisionId: string): Promise<void> {
    await this.prisma.relationalEconomicArbitrationDecision.update({
      where: { id: decisionId },
      data: { decisionType: RelationalEconomicArbitrationDecisionType.ARCHIVED },
    });
  }
}
