import { Injectable, Optional } from "@nestjs/common";
import type { DataIntelligenceBundleResponse, EconomicPropagationBundle } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence/data-intelligence-data.service";
import { DataIntelligenceBundleService } from "../data-intelligence/data-intelligence-bundle.service";
import { DataIntelligenceDataService } from "../data-intelligence/data-intelligence-data.service";
import { EconomicShockService } from "./economic-shock.service";
import { EconomicPropagationRealtimePublishService } from "./economic-propagation-realtime-publish.service";
import { EconomicMemoryStorageService } from "../economic-memory/economic-memory-storage.service";
import { PropagationRuleEngineService } from "./propagation-rule-engine.service";
import { PropagationSimulationService } from "./propagation-simulation.service";
import { TerritoryFragilityService } from "./territory-fragility.service";

export type EconomicPropagationSnapshot = DataIntelligenceCrossCutSnapshot & {
  dataIntelligence: {
    available: boolean;
    source: string;
    reason?: string;
    bundle?: DataIntelligenceBundleResponse;
  };
};

/**
 * Instruction 18.1 — cross-pole snapshot: reuses DataIntelligenceDataService + optional DataIntelligence bundle (no duplicated pole engines).
 */
@Injectable()
export class EconomicPropagationEngineService {
  private readonly composeCache = new Map<string, { at: number; pack: EconomicPropagationBundle }>();
  private readonly composeTtlMs = 4200;

  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly diData: DataIntelligenceDataService,
    private readonly diBundle: DataIntelligenceBundleService,
    private readonly shocks: EconomicShockService,
    private readonly rules: PropagationRuleEngineService,
    private readonly territory: TerritoryFragilityService,
    private readonly simulation: PropagationSimulationService,
    private readonly realtime: EconomicPropagationRealtimePublishService,
    @Optional() private readonly memory?: EconomicMemoryStorageService,
  ) {}

  async loadSnapshot(organizationId: string): Promise<EconomicPropagationSnapshot> {
    const core = await this.diData.loadCrossCut(organizationId);
    let dataIntelligence: EconomicPropagationSnapshot["dataIntelligence"];
    if (await this.flags.isEnabled("data_intelligence_enabled", { organizationId })) {
      try {
        const bundle = await this.diBundle.compose(organizationId);
        dataIntelligence = { available: true, source: "DataIntelligenceBundleService.compose", bundle };
      } catch {
        dataIntelligence = {
          available: false,
          source: "DataIntelligenceBundleService",
          reason: "compose_failed",
        };
      }
    } else {
      dataIntelligence = {
        available: false,
        source: "SOURCE_NOT_AVAILABLE",
        reason: "data_intelligence_disabled",
      };
    }
    return { ...core, dataIntelligence };
  }

  private withDiagnostics(
    pack: EconomicPropagationBundle,
    hit: boolean,
    organizationId: string,
  ): EconomicPropagationBundle {
    const cacheKey = `SHORT_TTL_PROPAGATION_CACHE:v1:${organizationId}`;
    const ruleCoverage = pack.shocks.map((s) => ({
      shockType: s.type,
      ...this.rules.ruleLookupMeta(s.type),
    }));
    return {
      ...pack,
      overview: {
        ...pack.overview,
        diagnostics: {
          cacheStrategy: "SHORT_TTL_PROPAGATION_CACHE",
          composeCache: "SHORT_TTL_PROPAGATION_CACHE",
          composeCacheHit: hit,
          cacheKey,
          ruleCoverage,
        },
      },
    };
  }

  async compose(organizationId: string, publishRealtime: boolean): Promise<EconomicPropagationBundle> {
    const now = Date.now();
    const hit = this.composeCache.get(organizationId);
    if (hit && now - hit.at < this.composeTtlMs) {
      return this.withDiagnostics(hit.pack, true, organizationId);
    }

    const snap = await this.loadSnapshot(organizationId);
    const shockOn = await this.flags.isEnabled("economic_shock_detection_enabled", { organizationId });
    const crossOn = await this.flags.isEnabled("cross_pole_propagation_enabled", { organizationId });
    const simOn = await this.flags.isEnabled("propagation_simulation_enabled", { organizationId });

    const shockList = shockOn ? this.shocks.detect(snap) : [];
    const chains = crossOn ? shockList.slice(0, 12).map((sh) => this.rules.buildPropagationChain(sh, snap)) : [];
    const territoryFragility = this.territory.build(snap, shockList);
    const simulationPreview = simOn ? this.simulation.previewFromSnapshot(snap) : this.simulation.disabledPreview(organizationId, snap.generatedAt);

    const systemicRiskRollup = Number(
      Math.min(
        1,
        shockList.reduce((m, s) => Math.max(m, s.systemicRisk), 0) * 0.55 + chains.reduce((m, c) => Math.max(m, c.systemicRiskScore), 0) * 0.45,
      ).toFixed(3),
    );

    const overview = {
      version: "1" as const,
      generatedAt: snap.generatedAt,
      organizationId,
      policy: "ACTIVE" as const,
      headline: `${shockList.length} propagation shock(s) · ${chains.length} chain(s) · ${territoryFragility.length} territory stress row(s)${!shockOn ? " · shock_detection_disabled" : ""}${!crossOn ? " · cross_pole_propagation_disabled" : ""}${!simOn ? " · simulation_preview_disabled" : ""}`,
      systemicRiskRollup,
      shockCount: shockList.length,
      chainCount: chains.length,
      territoryFragileTop: territoryFragility.filter((t) => t.fragilityScore > 0.35).length,
    };

    const inner: EconomicPropagationBundle = {
      version: "1",
      generatedAt: snap.generatedAt,
      organizationId,
      overview,
      shocks: shockList,
      chains,
      territoryFragility,
      simulationPreview,
      ...(snap.dataIntelligence.available && snap.dataIntelligence.bundle
        ? { upstreamDataIntelligenceBundle: snap.dataIntelligence.bundle }
        : {}),
    };
    this.composeCache.set(organizationId, { at: now, pack: inner });
    const out = this.withDiagnostics(inner, false, organizationId);
    this.memory?.persistPropagationSnapshot(inner);
    if (publishRealtime) void this.realtime.publishDomainAnalysis(organizationId, out);
    return out;
  }
}
