import { Injectable } from "@nestjs/common";
import type {
  EconomicCrisisSignatureRow,
  EconomicMemoryBriefing,
  EconomicMemoryBundle,
  EconomicMemoryHistoryRow,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";
import { PrismaService } from "../../prisma/prisma.service";
import { HistoricalPatternService } from "./historical-pattern.service";
import { PropagationHistoryService } from "./propagation-history.service";
import { TemporalEconomicAnalysisService } from "./temporal-economic-analysis.service";

@Injectable()
export class EconomicMemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly history: PropagationHistoryService,
    private readonly patterns: HistoricalPatternService,
    private readonly temporal: TemporalEconomicAnalysisService,
    private readonly ai: BackofficeAiGatewayService,
  ) {}

  async composeBundle(organizationId: string): Promise<EconomicMemoryBundle> {
    const on = await this.flags.isEnabled("economic_memory_enabled", { organizationId });
    const disclaimer =
      "Economic memory rows are sourced from persisted propagation engine snapshots (Instruction 18.1) — not ERP ledgers, not unconstrained logs. Crisis signatures are analytic labels with explicit limits.";

    if (!on) {
      return {
        version: "1",
        generatedAt: new Date().toISOString(),
        organizationId,
        policy: "DISABLED",
        headline: "Industrial economic memory is disabled for this organization.",
        disclaimer,
        crisisSignatures: [],
        temporalAnalysis: null,
        propagationHistoryPreview: [],
        shockPatterns: [],
        territoryHistoryPreview: [],
      };
    }

    const [history, patterns, crisisRows, lastTemporal] = await Promise.all([
      this.history.recentHistory(organizationId, 32),
      this.patterns.shockPatterns(organizationId),
      this.prisma.economicCrisisSignature.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      this.prisma.economicTemporalSnapshot.findFirst({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const territoryHistoryPreview = history.filter((h) => Boolean(h.territory)).slice(0, 16);

    const crisisSignatures: EconomicCrisisSignatureRow[] = crisisRows.map((r) => ({
      id: r.id,
      signatureCode: r.signatureCode,
      systemicRisk: r.systemicRisk,
      recurrenceProbability: r.recurrenceProbability,
      similarityIndex: r.similarityIndex,
      explanation: r.explanation,
      affectedPoles: r.affectedPoles as string[],
      recommendedPriority: r.recommendedPriority as EconomicCrisisSignatureRow["recommendedPriority"],
      territory: r.territory,
      createdAt: r.createdAt.toISOString(),
    }));

    const temporalAnalysis = lastTemporal ? this.temporal.mapRow(lastTemporal) : null;

    let briefing: EconomicMemoryBriefing | undefined;
    if (await this.flags.isEnabled("economic_memory_ai_enabled", { organizationId })) {
      briefing = this.ai.generateEconomicMemoryBriefing({
        organizationId,
        shockTypesSample: patterns.slice(0, 6).map((p) => p.shockType),
        signatureCodes: crisisSignatures.map((c) => c.signatureCode),
        topPatternTypes: patterns.slice(0, 5).map((p) => p.shockType),
        trendDirection: temporalAnalysis?.trendDirection ?? "FLAT",
        volatilityLevel: temporalAnalysis?.volatilityLevel ?? "LOW",
        eventDepth30d: await this.prisma.economicEventMemory.count({
          where: { organizationId, createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
        }),
        similarEventScore: temporalAnalysis?.similarEventScore ?? 0,
        historicalConfidence: temporalAnalysis?.historicalConfidence ?? 0.4,
        dataSources: ["economic_event_memories", "economic_propagation_memories", "economic_crisis_signatures", "economic_temporal_snapshots"],
      });
    }

    return {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId,
      policy: "ACTIVE",
      headline: `Economic memory — ${history.length} recent event row(s), ${patterns.length} shock pattern bucket(s), ${crisisSignatures.length} signature row(s) on file.`,
      disclaimer,
      crisisSignatures,
      temporalAnalysis,
      propagationHistoryPreview: history.slice(0, 24),
      shockPatterns: patterns,
      territoryHistoryPreview,
      briefing,
    };
  }

  async historyFeed(organizationId: string, limit: number): Promise<EconomicMemoryHistoryRow[]> {
    return this.history.recentHistory(organizationId, Math.min(64, Math.max(1, limit)));
  }

  async territoryFeed(organizationId: string, territory: string, limit: number): Promise<EconomicMemoryHistoryRow[]> {
    return this.history.territoryHistory(organizationId, territory, Math.min(48, Math.max(1, limit)));
  }
}
