import type { Logger } from "@nestjs/common";
import type { EconomicScenariosBundle } from "@venext/shared-contracts";
import type { PrismaService } from "../../prisma/prisma.service";

/**
 * Best-effort persistence for Instruction 18.3 / 18.3A.
 * Failures are logged only; callers must not await this on the hot request path for latency.
 */
export async function runPersistEconomicScenariosBundle(
  prisma: PrismaService,
  log: Pick<Logger, "warn">,
  organizationId: string,
  bundle: EconomicScenariosBundle,
): Promise<void> {
  const typeToId = new Map<string, string>();

  for (const s of bundle.scenarios) {
    const row = await prisma.economicScenario.upsert({
      where: {
        organizationId_scenarioType: { organizationId, scenarioType: s.scenarioType },
      },
      create: {
        organizationId,
        scenarioCode: s.scenarioCode,
        scenarioType: s.scenarioType,
        triggerType: s.triggerType,
        severity: s.severity,
        sourcePole: s.sourcePole,
        confidence: s.confidence,
        affectedPoles: s.affectedPoles,
        affectedTerritories: s.affectedTerritories,
        projectedRisk: s.projectedRisk,
        stabilizationProbability: s.stabilizationProbability,
        estimatedPropagationDepth: s.estimatedPropagationDepth,
        trajectory: s.trajectory as object,
        metadata: {
          ...(s.metadata as object),
          impacts: s.impacts,
          risk: s.risk,
          stabilization: s.stabilization,
          memoryLink: s.memoryLink,
        },
      },
      update: {
        scenarioCode: s.scenarioCode,
        triggerType: s.triggerType,
        severity: s.severity,
        sourcePole: s.sourcePole,
        confidence: s.confidence,
        affectedPoles: s.affectedPoles,
        affectedTerritories: s.affectedTerritories,
        projectedRisk: s.projectedRisk,
        stabilizationProbability: s.stabilizationProbability,
        estimatedPropagationDepth: s.estimatedPropagationDepth,
        trajectory: s.trajectory as object,
        metadata: {
          ...(s.metadata as object),
          impacts: s.impacts,
          risk: s.risk,
          stabilization: s.stabilization,
          memoryLink: s.memoryLink,
        },
      },
    });
    typeToId.set(s.scenarioType, row.id);

    await prisma.economicScenarioTrajectory.deleteMany({ where: { scenarioId: row.id } });
    await prisma.economicScenarioImpact.deleteMany({ where: { scenarioId: row.id } });

    if (s.trajectory.steps.length > 0) {
      await prisma.economicScenarioTrajectory.createMany({
        data: s.trajectory.steps.map((step, idx) => ({
          scenarioId: row.id,
          stepIndex: idx,
          label: step.label,
          systemicRisk: step.systemicRisk,
          unstableTerritories: step.unstableTerritories,
          impactedPoles: step.impactedPoles,
          stabilizationTrend: step.stabilizationTrend,
          volatilityShift: step.volatilityShift,
          propagationAcceleration: step.propagationAcceleration,
          metadata: {},
        })),
      });
    }

    if (s.impacts.length > 0) {
      await prisma.economicScenarioImpact.createMany({
        data: s.impacts.map((im) => ({
          scenarioId: row.id,
          targetPole: im.targetPole,
          impactKind: im.impactKind,
          intensity: im.intensity,
          confidence: im.confidence,
          sourceSignals: im.sourceSignals,
          metadata: {},
        })),
      });
    }
  }

  const batchIds = [...typeToId.values()];
  if (batchIds.length > 0) {
    await prisma.economicScenarioComparison.deleteMany({
      where: {
        organizationId,
        OR: [{ scenarioAId: { in: batchIds } }, { scenarioBId: { in: batchIds } }],
      },
    });
  }

  const comparisonRows = bundle.comparisons
    .map((c) => {
      const idA = typeToId.get(c.scenarioA.scenarioType);
      const idB = typeToId.get(c.scenarioB.scenarioType);
      if (!idA || !idB || idA === idB) return null;
      return {
        organizationId,
        scenarioAId: idA,
        scenarioBId: idB,
        similarityScore: c.similarityScore,
        escalationGap: c.escalationGap,
        stabilizationGap: c.stabilizationGap,
        systemicDifference: c.systemicDifference,
        metadata: {
          collapseSpeedHint: c.collapseSpeedHint,
          recoveryHint: c.recoveryHint,
          territoriesAffectedDelta: c.territoriesAffectedDelta,
        },
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (comparisonRows.length > 0) {
    await prisma.economicScenarioComparison.createMany({ data: comparisonRows });
  }
}
