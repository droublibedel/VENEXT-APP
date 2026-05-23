import { Injectable, Logger } from "@nestjs/common";
import {
  EconomicCommandBundleSchema,
  type EconomicCoordinationBundle,
  type EconomicCommandBundle,
  type EconomicCommandComposePlan,
  type EconomicCommandDiagnostics,
  type EconomicCommandOverview,
  type EconomicCommandProjectionMode,
  type EconomicCommandSnapshot,
  type EconomicCommandSourceBundles,
  type EconomicExecutiveSignal,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { EconomicCoordinationEngineService } from "../economic-coordination/economic-coordination-engine.service";
import { EconomicPropagationEngineService } from "../economic-propagation/economic-propagation-engine.service";
import { EconomicArbitrationService } from "./economic-arbitration.service";
import { EconomicCommandNarrativeService } from "./economic-command-narrative.service";
import { EconomicCommandRealtimePublishService } from "./economic-command-realtime-publish.service";
import type { EconomicCommandComposeContext } from "./economic-command.types";
import { EconomicDecisionRiskService } from "./economic-decision-risk.service";
import { EconomicPressureZoneService } from "./economic-pressure-zone.service";
import { EconomicSilentTensionService } from "./economic-silent-tension.service";
import { EconomicSystemStressService } from "./economic-system-stress.service";

const DISCLAIMER =
  "Salle de commandement économique (18.5) — lecture exécutive transverse, heuristique déterministe. Aucun agent autonome, aucun chatbot, aucune exécution métier, aucune décision automatique. Arbitrages et scores sont des proxies consultatifs; valider avec les directions métiers.";

const FULL_PROJECTION_WARNING =
  "Full projection embeds source bundles for audit/debug and should not be used for default UI loads.";

const COST_DISCLOSURE_ACTIVE =
  "Command summary may reuse caches but cold compose can invoke propagation, scenarios, memory, data-intelligence and coordination (nested under coordination compose).";

type CachedCommand = {
  at: number;
  bundle: EconomicCommandBundle;
  sourceBundles: EconomicCommandSourceBundles;
};

@Injectable()
export class EconomicCommandEngineService {
  private readonly log = new Logger(EconomicCommandEngineService.name);
  private readonly cache = new Map<string, CachedCommand>();
  private readonly ttlMs = 4200;

  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly propagation: EconomicPropagationEngineService,
    private readonly coordination: EconomicCoordinationEngineService,
    private readonly pressure: EconomicPressureZoneService,
    private readonly risks: EconomicDecisionRiskService,
    private readonly arbitrations: EconomicArbitrationService,
    private readonly stressSvc: EconomicSystemStressService,
    private readonly silent: EconomicSilentTensionService,
    private readonly narrativeSvc: EconomicCommandNarrativeService,
    private readonly realtime: EconomicCommandRealtimePublishService,
  ) {}

  async getBundleWithCacheMeta(
    organizationId: string,
    projection: EconomicCommandProjectionMode = "summary",
  ): Promise<{ bundle: EconomicCommandBundle; composeCacheHit: boolean }> {
    const now = Date.now();
    const enabled = await this.flags.isEnabled("economic_command_enabled", { organizationId });
    if (!enabled) {
      return { bundle: this.applyProjection(this.disabledBundle(organizationId), projection), composeCacheHit: false };
    }
    const coordOn = await this.flags.isEnabled("economic_coordination_enabled", { organizationId });
    if (!coordOn) {
      return { bundle: this.applyProjection(this.disabledBundle(organizationId, "coordination_dependency"), projection), composeCacheHit: false };
    }

    const cached = this.cache.get(organizationId);
    if (cached && now - cached.at < this.ttlMs) {
      return { bundle: this.applyProjection(this.withCacheHitOverlay(cached.bundle), projection, cached.sourceBundles), composeCacheHit: true };
    }

    const propagationBundle = await this.propagation.compose(organizationId, false);
    const { bundle: coordinationBundle, sourceBundles } = await this.coordination.composeBundleFromSeededPropagation(
      organizationId,
      propagationBundle,
    );

    const ctx: EconomicCommandComposeContext = {
      organizationId,
      propagationBundle: sourceBundles.propagationBundle,
      scenariosBundle: sourceBundles.scenariosBundle,
      coordinationBundle,
      memoryBundle: sourceBundles.memoryContext,
      dataIntelligenceBundle: sourceBundles.dataIntelligenceBundle,
    };

    const risksOn = await this.flags.isEnabled("economic_command_risk_enabled", { organizationId });
    const decisionRisks = risksOn ? this.risks.build(ctx) : [];
    const arbOn = await this.flags.isEnabled("economic_command_arbitration_enabled", { organizationId });
    const arbitrationList = arbOn ? this.arbitrations.build(ctx) : [];
    const tensionOn = await this.flags.isEnabled("economic_command_tension_enabled", { organizationId });
    const silentTensions = tensionOn ? this.silent.build(ctx) : [];
    const systemStress = this.stressSvc.build(ctx);
    const pressureZones = this.pressure.build(ctx, {
      silentTensions,
      silentStress: systemStress.silentStress,
    });

    const dominant = this.dominantStressLabel(systemStress);
    const narrative = this.narrativeSvc.build(ctx, { globalStress: systemStress.globalStress, dominant }, pressureZones.length, decisionRisks.length, arbitrationList.length, silentTensions.length);
    const executiveSignals = this.buildExecutiveSignals(organizationId, systemStress.globalStress, pressureZones, decisionRisks);

    const reused: string[] = [
      "EconomicPropagationEngineService.compose",
      "EconomicCoordinationEngineService.composeBundleFromSeededPropagation",
    ];
    if (coordinationBundle.diagnostics.dataIntelligenceReuse === "FROM_PROPAGATION") {
      reused.push("DataIntelligenceBundle:reused_via_propagation_upstream");
    } else {
      reused.push("DataIntelligenceBundle:composed_inside_coordination_compose");
    }

    const { plan: composePlan, composeCount } = this.buildComposePlan(coordinationBundle);
    const diagnostics: EconomicCommandDiagnostics = {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      proxySignals: true,
      sourceMode: "LIVE_ECONOMIC_COMMAND_COMPOSE",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      cacheStrategy: "SHORT_TTL_COMMAND_CACHE",
      composeCount,
      composePlan,
      composeCountMeaning: "logical_pipeline_steps_not_cpu_cost",
      costDisclosure: COST_DISCLOSURE_ACTIVE,
      reusedBundles: reused,
      sourceBundlesEmbedded: false,
    };

    const overview: EconomicCommandOverview = {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId,
      policy: "ACTIVE",
      headline: `Commande économique exécutive — stress global proxy ${systemStress.globalStress.toFixed(2)} · ${pressureZones.length} zone(s) · ${arbitrationList.length} arbitrage(s).`,
      executivePosture: coordinationBundle.posture.posture,
      dominantStress: dominant,
      tensionCount: silentTensions.length,
      pressureZoneCount: pressureZones.length,
      riskCount: decisionRisks.length,
      arbitrationCount: arbitrationList.length,
      signalDigest: `Priorités coordination: ${coordinationBundle.priorities.length} · conflits: ${coordinationBundle.conflicts.length} · chocs propagation: ${propagationBundle.overview.shockCount}.`,
    };

    const sourceBundlesFull: EconomicCommandSourceBundles = {
      propagationBundle: sourceBundles.propagationBundle,
      scenariosBundle: sourceBundles.scenariosBundle,
      coordinationBundle,
      memoryBundle: sourceBundles.memoryContext,
      dataIntelligenceBundle: sourceBundles.dataIntelligenceBundle,
    };

    const bundle: EconomicCommandBundle = {
      version: "1",
      generatedAt: overview.generatedAt,
      organizationId,
      policy: "ACTIVE",
      disclaimer: DISCLAIMER,
      overview,
      pressureZones,
      decisionRisks,
      arbitrations: arbitrationList,
      systemStress,
      silentTensions,
      narrative,
      executiveSignals,
      diagnostics: { ...diagnostics, projectionMode: projection, payloadWeightClass: projection === "full" ? "large" : "compact" },
      sourceMode: "LIVE_ECONOMIC_COMMAND_COMPOSE",
    };

    const parsed = EconomicCommandBundleSchema.safeParse(bundle);
    if (!parsed.success) {
      this.log.warn(`economic command bundle contract drift: ${parsed.error.message}`);
    }

    this.cache.set(organizationId, { at: now, bundle, sourceBundles: sourceBundlesFull });
    const rtOn = await this.flags.isEnabled("economic_command_realtime_enabled", { organizationId });
    if (rtOn) void this.realtime.publishCommandPulse(organizationId, bundle);

    return {
      bundle: this.applyProjection(bundle, projection, sourceBundlesFull),
      composeCacheHit: false,
    };
  }

  private dominantStressLabel(s: EconomicCommandBundle["systemStress"]): string {
    const entries: [string, number][] = [
      ["logistics", s.logisticsStress],
      ["financial", s.financialStress],
      ["relationship", s.relationshipStress],
      ["coordination", s.coordinationStress],
      ["scenario", s.scenarioStress],
      ["silent", s.silentStress],
    ];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0]![0] ?? "global";
  }

  private buildExecutiveSignals(
    organizationId: string,
    globalStress: number,
    zones: EconomicCommandBundle["pressureZones"],
    risks: EconomicCommandBundle["decisionRisks"],
  ): EconomicExecutiveSignal[] {
    const out: EconomicExecutiveSignal[] = [];
    if (globalStress > 0.52) {
      out.push({
        signalId: `ecmd-sig-stress-${organizationId.slice(0, 8)}`,
        signalType: "global_stress_elevated",
        headline: "Stress systémique proxy au-dessus du seuil de veille exécutive",
        intensity: Number(globalStress.toFixed(4)),
        affectedPoles: ["supply_logistics", "finance_collections", "commercial_network"],
        sourceSignals: ["command.systemStress.globalStress"],
        heuristicOnly: true,
        advisoryOnly: true,
      });
    }
    const top = zones[0];
    if (top) {
      out.push({
        signalId: `ecmd-sig-zone-${top.zoneId}`,
        signalType: "pressure_zone_lead",
        headline: `Zone dominante: ${top.label}`,
        intensity: top.pressureScore,
        affectedPoles: top.affectedPoles,
        sourceSignals: top.sourceSignals.slice(0, 8),
        heuristicOnly: true,
        advisoryOnly: true,
      });
    }
    const r = risks[0];
    if (r) {
      out.push({
        signalId: `ecmd-sig-risk-${r.riskId}`,
        signalType: "advisory_risk_lead",
        headline: r.decisionLabel,
        intensity: r.systemicExposure,
        affectedPoles: r.impactedPoles,
        sourceSignals: r.sourceSignals.slice(0, 8),
        heuristicOnly: true,
        advisoryOnly: true,
      });
    }
    return out.slice(0, 8);
  }

  private buildComposePlan(coordinationBundle: EconomicCoordinationBundle): {
    plan: EconomicCommandComposePlan;
    composeCount: number;
  } {
    const diN = coordinationBundle.diagnostics.dataIntelligenceComposeCount;
    const plan: EconomicCommandComposePlan = {
      propagationCompose: 1,
      coordinationCompose: 1,
      scenariosCompose: 1,
      memoryCompose: 1,
      dataIntelligenceCompose: diN,
      commandCompose: 1,
    };
    const composeCount =
      plan.propagationCompose +
      plan.coordinationCompose +
      plan.scenariosCompose +
      plan.memoryCompose +
      plan.dataIntelligenceCompose +
      plan.commandCompose;
    return { plan, composeCount };
  }

  private withCacheHitOverlay(bundle: EconomicCommandBundle): EconomicCommandBundle {
    return {
      ...bundle,
      diagnostics: { ...bundle.diagnostics, composeCacheHit: true },
    };
  }

  private buildSnapshot(bundle: EconomicCommandBundle, source: EconomicCommandSourceBundles): EconomicCommandSnapshot {
    return {
      version: "1",
      generatedAt: bundle.generatedAt,
      organizationId: bundle.organizationId,
      propagationBundle: source.propagationBundle,
      scenariosBundle: source.scenariosBundle,
      coordinationBundle: source.coordinationBundle,
      memoryBundle: source.memoryBundle,
      dataIntelligenceBundle: source.dataIntelligenceBundle,
      pressureSignals: bundle.pressureZones,
      decisionRiskSignals: bundle.decisionRisks,
      silentTensionSignals: bundle.silentTensions,
      executiveSignals: bundle.executiveSignals,
    };
  }

  private applyProjection(
    bundle: EconomicCommandBundle,
    projection: EconomicCommandProjectionMode,
    sourceBundles?: EconomicCommandSourceBundles,
  ): EconomicCommandBundle {
    const sourceBundlesEmbedded = projection === "full" && Boolean(sourceBundles);
    const snapshot =
      projection === "full" && sourceBundles ? this.buildSnapshot(bundle, sourceBundles) : undefined;
    const diag: EconomicCommandDiagnostics = {
      ...bundle.diagnostics,
      projectionMode: projection,
      sourceBundlesEmbedded,
      payloadWeightClass: sourceBundlesEmbedded ? "large" : "compact",
      composeCacheHit: bundle.diagnostics.composeCacheHit,
    };
    if (projection === "full") {
      diag.fullProjectionWarning = FULL_PROJECTION_WARNING;
    } else {
      delete (diag as { fullProjectionWarning?: string }).fullProjectionWarning;
    }
    const next: EconomicCommandBundle = {
      ...bundle,
      ...(sourceBundlesEmbedded && sourceBundles ? { sourceBundles } : {}),
      ...(snapshot ? { snapshot } : {}),
      diagnostics: diag,
    };
    if (!sourceBundlesEmbedded) {
      delete (next as { sourceBundles?: EconomicCommandSourceBundles }).sourceBundles;
    }
    if (!snapshot) {
      delete (next as { snapshot?: EconomicCommandSnapshot }).snapshot;
    }
    return next;
  }

  private disabledBundle(organizationId: string, reason?: "coordination_dependency"): EconomicCommandBundle {
    const ts = new Date().toISOString();
    const headline =
      reason === "coordination_dependency"
        ? "Economic command requires economic_coordination_enabled — enable coordination to compose the executive stack."
        : "Economic command layer disabled for this organization.";
    const zeroStress = {
      globalStress: 0,
      logisticsStress: 0,
      financialStress: 0,
      relationshipStress: 0,
      coordinationStress: 0,
      silentStress: 0,
      scenarioStress: 0,
      stressMode: "PROXY_HEURISTIC" as const,
      explanation: "Layer disabled — no stress inference.",
      sourceSignals: ["feature_flag:economic_command_enabled=false"],
    };
    const zeroPlan: EconomicCommandComposePlan = {
      propagationCompose: 0,
      coordinationCompose: 0,
      scenariosCompose: 0,
      memoryCompose: 0,
      dataIntelligenceCompose: 0,
      commandCompose: 0,
    };
    const diag: EconomicCommandDiagnostics = {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      proxySignals: true,
      sourceMode: reason === "coordination_dependency" ? "DISABLED_COORDINATION_DEPENDENCY" : "DISABLED",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      cacheStrategy: "SHORT_TTL_COMMAND_CACHE",
      composeCount: 0,
      composePlan: zeroPlan,
      composeCountMeaning: "logical_pipeline_steps_not_cpu_cost",
      costDisclosure: "Layer disabled — no upstream compose executed for this organization.",
      reusedBundles: [],
      sourceBundlesEmbedded: false,
    };
    return {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "DISABLED",
      disclaimer: DISCLAIMER,
      overview: {
        version: "1",
        generatedAt: ts,
        organizationId,
        policy: "DISABLED",
        headline,
        executivePosture: "STABLE",
        dominantStress: "none",
        tensionCount: 0,
        pressureZoneCount: 0,
        riskCount: 0,
        arbitrationCount: 0,
        signalDigest: "Command stack not materialized.",
      },
      pressureZones: [],
      decisionRisks: [],
      arbitrations: [],
      systemStress: zeroStress,
      silentTensions: [],
      narrative: {
        narrativeMode: "HEURISTIC_EXECUTIVE_SUMMARY",
        lines: [headline, "Advisory-only command layer is gated off.", "No execution paths are available in this state."],
        dominantPressure: "none",
        executiveWarning: "Enable required feature flags to activate the executive readout.",
        recommendedFocus: "Policy review — not an operational directive.",
        limitations: "Disabled bundle — diagnostics are placeholders only.",
      },
      executiveSignals: [],
      diagnostics: diag,
    };
  }
}
