import { Injectable } from "@nestjs/common";
import type { EconomicPropagationBundle, ScenarioMemoryLink } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";
import type { GeneratedScenarioCore, ScenarioMemoryContext } from "./scenario-generation.service";

@Injectable()
export class ScenarioMemoryLinkService {
  constructor(private readonly prisma: PrismaService) {}

  async link(
    organizationId: string,
    core: GeneratedScenarioCore,
    bundle: EconomicPropagationBundle,
    memory: ScenarioMemoryContext,
  ): Promise<ScenarioMemoryLink> {
    const recent =
      memory.recentMemoryEventTypes !== undefined
        ? memory.recentMemoryEventTypes.map((eventType) => ({ eventType }))
        : await this.prisma.economicEventMemory.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
            take: 40,
            select: { eventType: true },
          });
    const shockFamilies = new Set(bundle.shocks.map((s) => s.type));
    const memoryFamilies = new Set(recent.map((r) => r.eventType.split(".").pop() ?? r.eventType));
    let overlap = 0;
    for (const f of shockFamilies) {
      for (const m of memoryFamilies) {
        if (m.includes(f) || f.includes(m)) overlap++;
      }
    }
    const historicalSimilarity = Math.min(1, overlap * 0.12 + memory.eventDepth30d / 200 + memory.signatureHints.length * 0.06);
    const matched = memory.signatureHints.filter((s) => core.scenarioType.includes("liquidity") && s.includes("liquidity")).slice(0, 4);
    const patterns = memory.patternTypes.filter((p) => shockFamilies.has(p) || bundle.shocks.some((s) => s.type.includes(p))).slice(0, 6);
    const recurrenceLikelihood = Math.min(1, memory.eventDepth30d / 120 + (matched.length ? 0.15 : 0));

    return {
      historicalSimilarity: Number(historicalSimilarity.toFixed(3)),
      matchedHistoricalPatterns: [...new Set([...matched, ...patterns])].slice(0, 16),
      recurrenceLikelihood: Number(recurrenceLikelihood.toFixed(3)),
      explanation:
        "Linkage compares current propagation shock families with recent persisted memory event types — not causal proof.",
      dataSources: ["economic_event_memories", "economic_crisis_signatures", "live_propagation_bundle"],
    };
  }
}
