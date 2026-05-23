import { Injectable } from "@nestjs/common";
import type { EconomicPropagationBundle, EconomicTemporalAnalysis } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TemporalEconomicAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async persistFromBundle(bundle: EconomicPropagationBundle): Promise<void> {
    const org = bundle.organizationId;
    const since30 = new Date(Date.now() - 30 * 86_400_000);
    const eventDepth30d = await this.prisma.economicEventMemory.count({ where: { organizationId: org, createdAt: { gte: since30 } } });
    const prev = await this.prisma.economicTemporalSnapshot.findFirst({
      where: { organizationId: org },
      orderBy: { createdAt: "desc" },
    });
    const rollup = bundle.overview.systemicRiskRollup;
    let trendDirection: EconomicTemporalAnalysis["trendDirection"] = "FLAT";
    if (prev) {
      const prevRoll = Number((prev.metadata as { systemicRiskRollup?: number })?.systemicRiskRollup ?? rollup);
      if (rollup > prevRoll + 0.06) trendDirection = "UPWARD_STRESS";
      else if (rollup < prevRoll - 0.06) trendDirection = "DOWNWARD_STRESS";
    } else if (rollup > 0.55) trendDirection = "UPWARD_STRESS";
    else if (rollup < 0.28) trendDirection = "DOWNWARD_STRESS";

    const volatilityLevel: EconomicTemporalAnalysis["volatilityLevel"] =
      bundle.shocks.length > 6 ? "HIGH" : bundle.shocks.length > 2 ? "MODERATE" : "LOW";
    const accelerationFactor = Number(
      Math.min(2, 0.85 + bundle.chains.length * 0.04 + bundle.territoryFragility.filter((t) => t.fragilityScore > 0.4).length * 0.07).toFixed(3),
    );
    const stabilizationProbability = Number(
      Math.max(0.05, Math.min(0.92, 0.62 - rollup * 0.35 + (bundle.territoryFragility[0]?.resilienceScore ?? 0.2) * 0.2)).toFixed(3),
    );

    const similarEventScore = Number(Math.min(1, eventDepth30d / 80 + rollup * 0.25).toFixed(3));
    const recurrenceWeight = Number(Math.min(1, eventDepth30d / 120 + 0.12).toFixed(3));
    const historicalConfidence = Number(Math.min(0.94, 0.35 + Math.min(1, eventDepth30d / 200) * 0.5).toFixed(3));
    const propagationSimilarity = Number(
      Math.min(1, bundle.chains.reduce((m, c) => Math.max(m, c.propagationDepth), 0) / 8 + rollup * 0.2).toFixed(3),
    );

    await this.prisma.economicTemporalSnapshot.create({
      data: {
        organizationId: org,
        territory: null,
        trendDirection,
        volatilityLevel,
        accelerationFactor,
        stabilizationProbability: Number(stabilizationProbability),
        confidence: Number(historicalConfidence),
        sourceSignals: [
          `events30d:${eventDepth30d}`,
          `systemicRiskRollup:${rollup.toFixed(3)}`,
          `shockCount:${bundle.shocks.length}`,
        ],
        metadata: {
          systemicRiskRollup: rollup,
          fragileTop: bundle.territoryFragility[0]?.territory ?? null,
          unpaidEvolutionHint: `Heuristic unpaid stress from propagation bundle @ ${bundle.generatedAt}`,
          delayEvolutionHint: "Delay evolution uses propagation shock mix only — not TMS telematics.",
          fragileTerritoriesEvolutionHint: `${bundle.territoryFragility.filter((t) => t.fragilityScore > 0.35).length} territories above soft threshold.`,
          trustEvolutionHint: "Trust evolution inferred from relationship_fragmentation shock presence only.",
          propagationVelocityHint: `${bundle.chains.length} evaluated chains on this snapshot.`,
          similarEventScore,
          recurrenceWeight,
          historicalConfidence: Number(historicalConfidence),
          propagationSimilarity,
        },
      },
    });
  }

  mapRow(row: {
    trendDirection: string;
    volatilityLevel: string;
    accelerationFactor: number;
    stabilizationProbability: number;
    metadata: unknown;
  }): EconomicTemporalAnalysis {
    const m = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      trendDirection: row.trendDirection as EconomicTemporalAnalysis["trendDirection"],
      volatilityLevel: row.volatilityLevel as EconomicTemporalAnalysis["volatilityLevel"],
      accelerationFactor: row.accelerationFactor,
      stabilizationProbability: row.stabilizationProbability,
      unpaidEvolutionHint: String(m.unpaidEvolutionHint ?? "—"),
      delayEvolutionHint: String(m.delayEvolutionHint ?? "—"),
      fragileTerritoriesEvolutionHint: String(m.fragileTerritoriesEvolutionHint ?? "—"),
      trustEvolutionHint: String(m.trustEvolutionHint ?? "—"),
      propagationVelocityHint: String(m.propagationVelocityHint ?? "—"),
      similarEventScore: Number(m.similarEventScore ?? 0),
      recurrenceWeight: Number(m.recurrenceWeight ?? 0),
      historicalConfidence: Number(m.historicalConfidence ?? 0),
      propagationSimilarity: Number(m.propagationSimilarity ?? 0),
    };
  }
}
