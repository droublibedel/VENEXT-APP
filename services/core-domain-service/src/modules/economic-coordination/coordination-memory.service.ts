import { Injectable } from "@nestjs/common";
import type { EconomicCoordinationMemoryBlock, EconomicCoordinationSnapshot } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CoordinationMemoryService {
  constructor(private readonly prisma: PrismaService) {}

  async composeBlock(organizationId: string, snapshot: EconomicCoordinationSnapshot): Promise<EconomicCoordinationMemoryBlock> {
    const since60 = new Date(Date.now() - 60 * 86_400_000);
    const rows = await this.prisma.economicEventMemory.groupBy({
      by: ["eventType"],
      where: { organizationId, createdAt: { gte: since60 } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 12,
    });

    const recurringPatterns = rows.filter((r) => r._count.id >= 3).map((r) => `eventType:${r.eventType}:${r._count.id}`);

    const sigs = snapshot.memoryContext.crisisSignatures.slice(0, 6);
    const recurringConflicts = sigs
      .filter((s) => s.recurrenceProbability > 0.35)
      .map((s) => `signature:${s.signatureCode}`);

    const stabHints = snapshot.scenariosBundle.scenarios
      .filter((s) => s.stabilizationProbability > 0.55)
      .map((s) => `stabilization_bias:${s.scenarioType}`)
      .slice(0, 8);
    const recurringStabilizationPatterns = [...new Set(stabHints)];

    const memoryConfidence = Number(
      Math.min(1, 0.28 + Math.min(12, rows.length) * 0.04 + recurringPatterns.length * 0.08).toFixed(4),
    );
    const temporalSim = snapshot.memoryContext.temporalAnalysis?.similarEventScore ?? 0.4;
    const historicalSimilarity = Number(Math.min(1, temporalSim * 0.7 + (recurringPatterns.length > 0 ? 0.2 : 0)).toFixed(4));

    return {
      recurringPatterns: recurringPatterns.length ? recurringPatterns : ["pattern_sparse_window"],
      recurringConflicts: recurringConflicts.length ? recurringConflicts : ["no_high_recurrence_signature"],
      recurringStabilizationPatterns: recurringStabilizationPatterns.length
        ? recurringStabilizationPatterns
        : ["stabilization_sparse"],
      memoryConfidence,
      historicalSimilarity,
      signals: rows.slice(0, 6).map((r) => ({
        patternCode: r.eventType,
        weight: Number(Math.min(1, r._count.id / 10).toFixed(4)),
        explanation: `Deterministic 60d recurrence weight for ${r.eventType} (no ML training).`,
      })),
      diagnostics: ["heuristic:groupBy_eventType_60d", "reuse:snapshot.memoryContext"],
    };
  }
}
