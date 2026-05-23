import { Injectable, Logger } from "@nestjs/common";
import {
  EconomicCoordinationBundleSchema,
  EconomicCoordinationSnapshotSchema,
  type DataIntelligenceBundleResponse,
  type EconomicCoordinationBundle,
  type EconomicCoordinationOverview,
  type EconomicCoordinationProjection,
  type EconomicCoordinationSnapshot,
  type EconomicCoordinationSourceBundles,
  type EconomicPropagationBundle,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { DataIntelligenceBundleService } from "../data-intelligence/data-intelligence-bundle.service";
import { EconomicMemoryService } from "../economic-memory/economic-memory.service";
import { EconomicPropagationEngineService } from "../economic-propagation/economic-propagation-engine.service";
import { EconomicScenariosEngineService } from "../economic-scenarios/economic-scenarios-engine.service";
import { CoordinationConflictService } from "./coordination-conflict.service";
import { CoordinationMemoryService } from "./coordination-memory.service";
import { CrossPolePriorityService } from "./cross-pole-priority.service";
import { EconomicCoordinationRealtimePublishService } from "./economic-coordination-realtime-publish.service";
import { isSupplyShock } from "./economic-coordination-shock-taxonomy";
import {
  buildDisabledConflictsSlice,
  buildDisabledEscalationSlice,
  buildDisabledMemorySlice,
  buildDisabledOrchestrationSlice,
} from "./economic-coordination-stub-builders";
import { EconomicEscalationService } from "./economic-escalation.service";
import { EconomicPostureService } from "./economic-posture.service";
import { ResponseOrchestrationService } from "./response-orchestration.service";

const DISCLAIMER =
  "Couche de coordination économique industrielle (18.4) — lecture analytique transverse. Aucun agent autonome, aucune exécution métier, aucun write commandes/paiements/stocks. Orchestration symbolique et arbitrages documentés uniquement.";

type CachedCoordination = {
  at: number;
  bundle: EconomicCoordinationBundle;
  sourceBundles: EconomicCoordinationSourceBundles;
};

@Injectable()
export class EconomicCoordinationEngineService {
  private readonly log = new Logger(EconomicCoordinationEngineService.name);
  private readonly cache = new Map<string, CachedCoordination>();
  private readonly ttlMs = 4200;

  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly propagation: EconomicPropagationEngineService,
    private readonly scenarios: EconomicScenariosEngineService,
    private readonly memory: EconomicMemoryService,
    private readonly di: DataIntelligenceBundleService,
    private readonly postureSvc: EconomicPostureService,
    private readonly conflictSvc: CoordinationConflictService,
    private readonly prioritySvc: CrossPolePriorityService,
    private readonly orchestrationSvc: ResponseOrchestrationService,
    private readonly escalationSvc: EconomicEscalationService,
    private readonly coordinationMemorySvc: CoordinationMemoryService,
    private readonly realtime: EconomicCoordinationRealtimePublishService,
  ) {}

  async getBundleWithCacheMeta(
    organizationId: string,
    projection: EconomicCoordinationProjection = "summary",
  ): Promise<{ bundle: EconomicCoordinationBundle; composeCacheHit: boolean }> {
    const now = Date.now();
    const enabled = await this.flags.isEnabled("economic_coordination_enabled", { organizationId });
    if (!enabled) {
      return { bundle: this.applyProjection(this.disabledBundle(organizationId), undefined, projection), composeCacheHit: false };
    }
    const cached = this.cache.get(organizationId);
    if (cached && now - cached.at < this.ttlMs) {
      const bundle = this.withLiveCacheHitOverlay(cached.bundle);
      return { bundle: this.applyProjection(bundle, cached.sourceBundles, projection), composeCacheHit: true };
    }
    const { bundle, sourceBundles } = await this.composeFresh(organizationId);
    this.cache.set(organizationId, { at: now, bundle, sourceBundles });
    void this.realtime.publishCoordinationPulse(organizationId, bundle);
    return {
      bundle: this.applyProjection(
        {
          ...bundle,
          liveComposeDiagnostics: {
            composeCacheHit: false,
            cacheStrategy: "SHORT_TTL_COORDINATION_CACHE",
            serverCost: "FULL_COMPOSE",
          },
        },
        sourceBundles,
        projection,
      ),
      composeCacheHit: false,
    };
  }

  async getBundle(organizationId: string, projection: EconomicCoordinationProjection = "summary"): Promise<EconomicCoordinationBundle> {
    const { bundle } = await this.getBundleWithCacheMeta(organizationId, projection);
    return bundle;
  }

  private withLiveCacheHitOverlay(bundle: EconomicCoordinationBundle): EconomicCoordinationBundle {
    return {
      ...bundle,
      overview: {
        ...bundle.overview,
        diagnostics: bundle.overview.diagnostics
          ? {
              ...bundle.overview.diagnostics,
              composeCache: "SHORT_TTL_COORDINATION_CACHE",
              composeCacheHit: true,
              cacheStrategy: "SHORT_TTL_COORDINATION_CACHE",
              snapshotReuse: "SINGLE_PROPAGATION_THEN_PARALLEL_SCENARIOS_MEMORY_DI",
            }
          : undefined,
      },
      diagnostics: { ...bundle.diagnostics, composeCacheHit: true },
      liveComposeDiagnostics: {
        composeCacheHit: true,
        cacheStrategy: "SHORT_TTL_COORDINATION_CACHE",
        serverCost: "FULL_COMPOSE",
      },
    };
  }

  private applyProjection(
    bundle: EconomicCoordinationBundle,
    sourceBundles: EconomicCoordinationSourceBundles | undefined,
    projection: EconomicCoordinationProjection,
  ): EconomicCoordinationBundle {
    const sourceBundlesEmbedded = projection === "full" && Boolean(sourceBundles);
    const diagOverlay = {
      payloadProjection: projection,
      sourceBundlesEmbedded,
    };
    const overviewDiag =
      bundle.overview.diagnostics === undefined
        ? {
            composeCache: "SHORT_TTL_COORDINATION_CACHE" as const,
            composeCacheHit: bundle.diagnostics.composeCacheHit,
            cacheStrategy: "SHORT_TTL_COORDINATION_CACHE" as const,
            snapshotReuse: "SINGLE_PROPAGATION_THEN_PARALLEL_SCENARIOS_MEMORY_DI" as const,
            ...diagOverlay,
            strategicPressureSource: "DATA_INTELLIGENCE_ECONOMIC_PROPAGATION_SCORE" as const,
            strategicPressureLabel: "systemic intelligence pressure proxy",
          }
        : {
            ...bundle.overview.diagnostics,
            ...diagOverlay,
            strategicPressureSource: "DATA_INTELLIGENCE_ECONOMIC_PROPAGATION_SCORE" as const,
            strategicPressureLabel: "systemic intelligence pressure proxy",
          };
    const next: EconomicCoordinationBundle = {
      ...bundle,
      ...(sourceBundlesEmbedded && sourceBundles ? { sourceBundles } : {}),
      overview: {
        ...bundle.overview,
        diagnostics: overviewDiag,
      },
      diagnostics: {
        ...bundle.diagnostics,
        ...diagOverlay,
      },
    };
    if (!sourceBundlesEmbedded) {
      delete (next as { sourceBundles?: EconomicCoordinationSourceBundles }).sourceBundles;
    }
    return next;
  }

  private disabledBundle(organizationId: string): EconomicCoordinationBundle {
    const ts = new Date().toISOString();
    const overview: EconomicCoordinationOverview = {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "DISABLED",
      headline: "Economic coordination layer disabled for this organization.",
      activeConflictCount: 0,
      priorityCount: 0,
      orchestrationCount: 0,
      posture: "STABLE",
      escalationLevel: "LOW",
      systemicRiskRollup: 0,
      coordinationStressRollup: 0,
      realtimePressure: 0,
      organizationSignals: 0,
      systemicIntelligencePressure: 0,
      operationalPressure: 0,
      financialPressure: 0,
      logisticsPressure: 0,
    };
    return {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "DISABLED",
      headline: overview.headline,
      disclaimer: DISCLAIMER,
      overview,
      posture: {
        posture: "STABLE",
        confidence: 0,
        systemicRisk: 0,
        coordinationStress: 0,
        explanation: "Coordination disabled — stable placeholder posture (no inference).",
        sourceSignals: ["feature_flag:economic_coordination_enabled=false"],
        affectedPoles: [],
        affectedTerritories: [],
      },
      priorities: [],
      conflicts: [],
      orchestrations: [],
      escalation: {
        escalationLevel: "LOW",
        escalationScore: 0,
        escalationDrivers: ["coordination_disabled"],
        affectedPoles: [],
        coordinationRecommendation: "Enable economic_coordination_enabled to materialize cross-pole readouts.",
        executiveAttentionRequired: false,
        diagnostics: ["policy:DISABLED"],
      },
      memory: {
        recurringPatterns: [],
        recurringConflicts: [],
        recurringStabilizationPatterns: [],
        memoryConfidence: 0,
        historicalSimilarity: 0,
        signals: [],
        diagnostics: ["policy:DISABLED"],
      },
      diagnostics: {
        composeCacheHit: false,
        cacheStrategy: "SHORT_TTL_COORDINATION_CACHE",
        coordinationPipeline: "DISABLED",
        sourceLabels: ["feature_flags"],
        payloadProjection: "summary",
        sourceBundlesEmbedded: false,
        dataIntelligenceReuse: "UNAVAILABLE",
        dataIntelligenceComposeCount: 0,
      },
    };
  }

  async composeBundleFromSeededPropagation(
    organizationId: string,
    propagationBundle: EconomicPropagationBundle,
  ): Promise<{ bundle: EconomicCoordinationBundle; sourceBundles: EconomicCoordinationSourceBundles }> {
    return this.composeFromPropagationSeed(organizationId, propagationBundle);
  }

  private async composeFresh(organizationId: string): Promise<{
    bundle: EconomicCoordinationBundle;
    sourceBundles: EconomicCoordinationSourceBundles;
  }> {
    const propagationBundle = await this.propagation.compose(organizationId, false);
    return this.composeFromPropagationSeed(organizationId, propagationBundle);
  }

  private async composeFromPropagationSeed(
    organizationId: string,
    propagationBundle: EconomicPropagationBundle,
  ): Promise<{
    bundle: EconomicCoordinationBundle;
    sourceBundles: EconomicCoordinationSourceBundles;
  }> {
    const upstreamDi = propagationBundle.upstreamDataIntelligenceBundle;

    const diPromise = upstreamDi ? Promise.resolve(upstreamDi) : this.di.compose(organizationId);
    const settled = await Promise.allSettled([
      this.scenarios.composeFreshFromPropagation(organizationId, propagationBundle),
      this.memory.composeBundle(organizationId),
      diPromise,
    ]);

    const scenariosBundle =
      settled[0]!.status === "fulfilled"
        ? settled[0]!.value
        : await this.scenarios.composeFreshFromPropagation(organizationId, propagationBundle);
    const memoryContext =
      settled[1]!.status === "fulfilled" ? settled[1]!.value : await this.memory.composeBundle(organizationId);

    let dataIntelligenceComposeCount = 0;
    let dataIntelligenceReuse: "FROM_PROPAGATION" | "DIRECT_COMPOSE" | "UNAVAILABLE";
    let dataIntelligenceBundle: DataIntelligenceBundleResponse;
    if (upstreamDi) {
      dataIntelligenceBundle = upstreamDi;
      dataIntelligenceReuse = "FROM_PROPAGATION";
    } else {
      dataIntelligenceReuse = "DIRECT_COMPOSE";
      if (settled[2]!.status === "fulfilled") {
        dataIntelligenceBundle = settled[2]!.value as DataIntelligenceBundleResponse;
        dataIntelligenceComposeCount = 1;
      } else {
        dataIntelligenceBundle = await this.di.compose(organizationId);
        dataIntelligenceComposeCount = 2;
      }
    }

    for (const r of settled) {
      if (r.status === "rejected") {
        this.log.warn(`coordination parallel upstream rejected: ${String(r.reason)}`);
      }
    }

    const realtimePressure = Number(Math.min(1, propagationBundle.overview.systemicRiskRollup).toFixed(4));
    const organizationSignals = Number(Math.min(1, propagationBundle.overview.shockCount / 14).toFixed(4));
    const systemicIntelligencePressure = Number(
      Math.min(1, dataIntelligenceBundle.overview.economicPropagationScore).toFixed(4),
    );
    const operationalPressure = Number(Math.min(1, scenariosBundle.overview.maxProjectedRisk).toFixed(4));
    const finFromMemory =
      memoryContext.crisisSignatures.length === 0
        ? operationalPressure * 0.25
        : memoryContext.crisisSignatures.reduce((s, c) => s + c.systemicRisk, 0) / memoryContext.crisisSignatures.length;
    const financialPressure = Number(Math.min(1, finFromMemory).toFixed(4));
    const supplyShockRisk = propagationBundle.shocks
      .filter((s) => isSupplyShock(s))
      .reduce((m, s) => Math.max(m, s.systemicRisk), 0);
    const logisticsExposureAvg =
      propagationBundle.territoryFragility.length === 0
        ? 0
        : propagationBundle.territoryFragility.reduce((s, t) => s + t.logisticsExposure, 0) /
          propagationBundle.territoryFragility.length;
    const logisticsPressure = Number(Math.min(1, supplyShockRisk * 0.55 + logisticsExposureAvg * 0.45).toFixed(4));

    const snapshotRaw: EconomicCoordinationSnapshot = {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId,
      propagationBundle,
      scenariosBundle,
      memoryContext,
      dataIntelligenceBundle,
      realtimePressure,
      organizationSignals,
      systemicIntelligencePressure,
      operationalPressure,
      financialPressure,
      logisticsPressure,
    };

    const snapParsed = EconomicCoordinationSnapshotSchema.safeParse(snapshotRaw);
    if (!snapParsed.success) {
      this.log.warn(`coordination snapshot contract drift: ${snapParsed.error.message}`);
    }

    const posture = this.postureSvc.derive(snapshotRaw);
    const conflictOn = await this.flags.isEnabled("coordination_conflict_enabled", { organizationId });
    const conflicts = conflictOn ? this.conflictSvc.detect(snapshotRaw) : buildDisabledConflictsSlice();

    const priorities = this.prioritySvc.rank(snapshotRaw, posture, conflicts);

    const orchOn = await this.flags.isEnabled("coordination_orchestration_enabled", { organizationId });
    const orchestrations = orchOn
      ? this.orchestrationSvc.build(snapshotRaw, posture, priorities, conflicts)
      : buildDisabledOrchestrationSlice();

    const escOn = await this.flags.isEnabled("economic_escalation_enabled", { organizationId });
    const escalation = escOn
      ? this.escalationSvc.assess(snapshotRaw, posture, conflicts)
      : buildDisabledEscalationSlice();

    const memOn = await this.flags.isEnabled("coordination_memory_enabled", { organizationId });
    const memory = memOn ? await this.coordinationMemorySvc.composeBlock(organizationId, snapshotRaw) : buildDisabledMemorySlice();

    const overview: EconomicCoordinationOverview = {
      version: "1",
      generatedAt: snapshotRaw.generatedAt,
      organizationId,
      policy: "ACTIVE",
      headline: `Posture ${posture.posture} · ${conflicts.length} coordination conflict(s) · ${priorities.length} cross-pole priorities (symbolic).`,
      activeConflictCount: conflicts.length,
      priorityCount: priorities.length,
      orchestrationCount: orchestrations.length,
      posture: posture.posture,
      escalationLevel: escalation.escalationLevel,
      systemicRiskRollup: posture.systemicRisk,
      coordinationStressRollup: posture.coordinationStress,
      realtimePressure,
      organizationSignals,
      systemicIntelligencePressure,
      operationalPressure,
      financialPressure,
      logisticsPressure,
      diagnostics: {
        composeCache: "SHORT_TTL_COORDINATION_CACHE",
        composeCacheHit: false,
        cacheStrategy: "SHORT_TTL_COORDINATION_CACHE",
        snapshotReuse: "SINGLE_PROPAGATION_THEN_PARALLEL_SCENARIOS_MEMORY_DI",
        strategicPressureSource: "DATA_INTELLIGENCE_ECONOMIC_PROPAGATION_SCORE",
        strategicPressureLabel: "systemic intelligence pressure proxy",
      },
    };

    const sourceBundles: EconomicCoordinationSourceBundles = {
      propagationBundle,
      scenariosBundle,
      memoryContext,
      dataIntelligenceBundle,
    };

    const bundle: EconomicCoordinationBundle = {
      version: "1",
      generatedAt: snapshotRaw.generatedAt,
      organizationId,
      policy: "ACTIVE",
      headline: overview.headline,
      disclaimer: DISCLAIMER,
      overview,
      posture,
      priorities,
      conflicts,
      orchestrations,
      escalation,
      memory,
      diagnostics: {
        composeCacheHit: false,
        cacheStrategy: "SHORT_TTL_COORDINATION_CACHE",
        coordinationPipeline: "REUSE_PROPAGATION_THEN_PARALLEL_SCENARIOS_MEMORY_DI",
        sourceLabels: [
          "EconomicPropagationEngineService.compose",
          "EconomicScenariosEngineService.composeFreshFromPropagation",
          "EconomicMemoryService.composeBundle",
          upstreamDi ? "DataIntelligenceBundleService.via_propagation_upstream" : "DataIntelligenceBundleService.compose",
        ],
        payloadProjection: "summary",
        sourceBundlesEmbedded: false,
        dataIntelligenceReuse,
        dataIntelligenceComposeCount,
      },
      sourceMode: "LIVE_COORDINATION_COMPOSE",
    };

    const parsed = EconomicCoordinationBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      this.log.warn(`coordination bundle contract drift: ${parsed.error.message}`);
    }
    return { bundle, sourceBundles };
  }
}
