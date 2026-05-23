import { Injectable, Logger } from "@nestjs/common";
import {
  EconomicScenariosBundleSchema,
  type EconomicPropagationBundle,
  type EconomicScenariosBundle,
  type EconomicScenarioProjection,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";
import { EconomicPropagationEngineService } from "../economic-propagation/economic-propagation-engine.service";
import { EconomicScenariosRealtimePublishService } from "./economic-scenarios-realtime-publish.service";
import { runPersistEconomicScenariosBundle } from "./economic-scenarios-persist.util";
import { ScenarioComparisonService } from "./scenario-comparison.service";
import { ScenarioGenerationService } from "./scenario-generation.service";
import { ScenarioImpactService } from "./scenario-impact.service";
import { ScenarioMemoryLinkService } from "./scenario-memory-link.service";
import { ScenarioRiskService } from "./scenario-risk.service";
import { ScenarioStabilizationService } from "./scenario-stabilization.service";
import { ScenarioTrajectoryService } from "./scenario-trajectory.service";

@Injectable()
export class EconomicScenariosEngineService {
  private readonly log = new Logger(EconomicScenariosEngineService.name);
  private readonly cache = new Map<string, { at: number; bundle: EconomicScenariosBundle }>();
  private readonly ttlMs = 4200;

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly propagation: EconomicPropagationEngineService,
    private readonly generation: ScenarioGenerationService,
    private readonly trajectory: ScenarioTrajectoryService,
    private readonly impact: ScenarioImpactService,
    private readonly comparison: ScenarioComparisonService,
    private readonly risk: ScenarioRiskService,
    private readonly stabilization: ScenarioStabilizationService,
    private readonly memoryLink: ScenarioMemoryLinkService,
    private readonly realtime: EconomicScenariosRealtimePublishService,
    private readonly ai: BackofficeAiGatewayService,
  ) {}

  async getBundleWithCacheMeta(organizationId: string): Promise<{ bundle: EconomicScenariosBundle; composeCacheHit: boolean }> {
    const now = Date.now();
    const cached = this.cache.get(organizationId);
    if (cached && now - cached.at < this.ttlMs) {
      return { bundle: cached.bundle, composeCacheHit: true };
    }
    const fresh = await this.composeFresh(organizationId);
    this.cache.set(organizationId, { at: now, bundle: fresh });
    void this.realtime.publishScenariosPulse(organizationId, fresh);
    void this.persistScenarios(organizationId, fresh);
    return { bundle: fresh, composeCacheHit: false };
  }

  async getBundle(organizationId: string): Promise<EconomicScenariosBundle> {
    const { bundle } = await this.getBundleWithCacheMeta(organizationId);
    return bundle;
  }

  /**
   * Instruction 18.4 — compose scenarios from an already materialized propagation bundle so coordination
   * does not trigger a second propagation compose on cold cache.
   */
  async composeFreshFromPropagation(
    organizationId: string,
    propagationBundle: EconomicPropagationBundle,
  ): Promise<EconomicScenariosBundle> {
    return this.composeFresh(organizationId, propagationBundle);
  }

  private async composeFresh(
    organizationId: string,
    propagationBundlePreloaded?: EconomicPropagationBundle,
  ): Promise<EconomicScenariosBundle> {
    const enabled = await this.flags.isEnabled("economic_scenarios_enabled", { organizationId });
    const disclaimer =
      "Industrial economic scenarios are deterministic projections from propagation snapshots (18.1) and optional stored memory (18.2). Not a financial simulator; not GIS; not hidden RNG.";
    if (!enabled) {
      const ts = new Date().toISOString();
      return {
        version: "1",
        generatedAt: ts,
        organizationId,
        policy: "DISABLED",
        headline: "Economic scenario engine is disabled for this organization.",
        disclaimer,
        overview: {
          version: "1",
          generatedAt: ts,
          organizationId,
          policy: "DISABLED",
          headline: "Disabled",
          scenarioCount: 0,
          maxProjectedRisk: 0,
          meanStabilizationProbability: 0,
          dominantScenarioTypes: [],
        },
        scenarios: [],
        comparisons: [],
      };
    }

    const propagationBundle =
      propagationBundlePreloaded ?? (await this.propagation.compose(organizationId, false));
    const riskOn = await this.flags.isEnabled("scenario_risk_enabled", { organizationId });
    const stabOn = await this.flags.isEnabled("scenario_stabilization_enabled", { organizationId });
    const memOn = await this.flags.isEnabled("scenario_memory_enabled", { organizationId });

    const since30 = new Date(Date.now() - 30 * 86_400_000);
    const recentMemoryRows = memOn
      ? await this.prisma.economicEventMemory.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 40,
          select: { eventType: true },
        })
      : [];
    const memoryCtx = memOn
      ? {
          eventDepth30d: await this.prisma.economicEventMemory.count({
            where: { organizationId, createdAt: { gte: since30 } },
          }),
          signatureHints: (
            await this.prisma.economicCrisisSignature.findMany({
              where: { organizationId },
              orderBy: { createdAt: "desc" },
              take: 8,
              select: { signatureCode: true },
            })
          ).map((s) => s.signatureCode),
          patternTypes: [
            ...new Set(
              (
                await this.prisma.economicEventMemory.findMany({
                  where: { organizationId, eventType: { startsWith: "propagation_shock." } },
                  take: 40,
                  select: { eventType: true },
                })
              ).map((e) => e.eventType.replace("propagation_shock.", "")),
            ),
          ].slice(0, 12),
          recentMemoryEventTypes: recentMemoryRows.map((r) => r.eventType),
          memoryPrefetch: true,
          memoryPrefetchCount: recentMemoryRows.length,
          memoryReuseStrategy: "COMPOSE_LEVEL_MEMORY_CONTEXT" as const,
        }
      : { eventDepth30d: 0, signatureHints: [] as string[], patternTypes: [] as string[] };

    const cores = this.generation.generate({ organizationId, bundle: propagationBundle, memory: memoryCtx });

    const projections: EconomicScenarioProjection[] = [];
    for (const core of cores) {
      const traj = this.trajectory.project(propagationBundle, core);
      const impacts = this.impact.buildImpacts(propagationBundle, core);
      const risk = riskOn ? this.risk.assess(core, propagationBundle, traj) : undefined;
      const stabilization = stabOn ? this.stabilization.propose(core, propagationBundle) : undefined;
      const memoryLink = memOn ? await this.memoryLink.link(organizationId, core, propagationBundle, memoryCtx) : undefined;
      projections.push({
        scenarioCode: core.scenarioCode,
        scenarioType: core.scenarioType,
        triggerType: core.triggerType,
        severity: core.severity,
        sourcePole: core.sourcePole,
        confidence: core.confidence,
        affectedPoles: core.affectedPoles,
        affectedTerritories: core.affectedTerritories,
        projectedRisk: core.projectedRisk,
        stabilizationProbability: core.stabilizationProbability,
        estimatedPropagationDepth: core.estimatedPropagationDepth,
        trajectory: traj,
        impacts,
        risk,
        stabilization,
        memoryLink,
        metadata: core.metadata,
      });
    }

    const comparisons = this.comparison.compareAll(projections);
    const maxProjectedRisk = projections.reduce((m, p) => Math.max(m, p.projectedRisk), 0);
    const meanStab =
      projections.length === 0 ? 0 : projections.reduce((s, p) => s + p.stabilizationProbability, 0) / projections.length;
    const dominantScenarioTypes = [...new Set(projections.map((p) => p.scenarioType))].slice(0, 8);

    let briefing: EconomicScenariosBundle["briefing"];
    if (await this.flags.isEnabled("economic_scenarios_ai_enabled", { organizationId })) {
      briefing = this.ai.generateEconomicScenarioBriefing({
        organizationId,
        scenarioTypesSample: projections.slice(0, 6).map((p) => p.scenarioType),
        maxProjectedRisk,
        comparisonCount: comparisons.length,
        memorySparse: memoryCtx.eventDepth30d === 0,
        dataSources: ["economic_propagation_compose", "economic_scenarios_engine", "optional:economic_event_memories"],
      });
    }

    const ts = new Date().toISOString();
    const raw: EconomicScenariosBundle = {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "ACTIVE",
      headline: `${projections.length} deterministic industrial scenario(s) from current propagation + memory context.`,
      disclaimer,
      overview: {
        version: "1",
        generatedAt: ts,
        organizationId,
        policy: "ACTIVE",
        headline: `Max projected risk ${maxProjectedRisk.toFixed(2)} — symbolic lattice only.`,
        scenarioCount: projections.length,
        maxProjectedRisk: Number(maxProjectedRisk.toFixed(3)),
        meanStabilizationProbability: Number(meanStab.toFixed(3)),
        dominantScenarioTypes,
        ...(memOn
          ? {
              diagnostics: {
                memoryPrefetch: true,
                memoryPrefetchCount: recentMemoryRows.length,
                memoryReuseStrategy: "COMPOSE_LEVEL_MEMORY_CONTEXT" as const,
              },
            }
          : {}),
      },
      scenarios: projections,
      comparisons,
      briefing,
    };

    const parsed = EconomicScenariosBundleSchema.safeParse(raw);
    if (!parsed.success) {
      this.log.warn(`economic scenarios bundle contract drift: ${parsed.error.message}`);
      return raw;
    }
    return parsed.data;
  }

  private persistScenarios(organizationId: string, bundle: EconomicScenariosBundle): void {
    if (bundle.policy !== "ACTIVE") return;
    void runPersistEconomicScenariosBundle(this.prisma, this.log, organizationId, bundle).catch((e) =>
      this.log.warn(`economic_scenarios persist: ${String(e)}`),
    );
  }
}
