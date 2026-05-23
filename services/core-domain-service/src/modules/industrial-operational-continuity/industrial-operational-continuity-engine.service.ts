import { Injectable } from "@nestjs/common";
import type {
  ContinuityPressure,
  CriticalContinuityCorridor,
  IndustrialOperationalContinuityBriefings,
  IndustrialOperationalContinuityBundle,
  IndustrialOperationalContinuityComposePlan,
  IndustrialOperationalContinuityDiagnostics,
  IndustrialOperationalContinuityProjectionMode,
  IndustrialOperationalContinuitySnapshot,
  IndustrialSituationRoomBundle,
  OperationalCadenceSignal,
  OperationalStabilityState,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { IndustrialSituationRoomEngineService } from "../industrial-situation-room/industrial-situation-room-engine.service";
import { IndustrialOperationalContinuityRealtimePublishService } from "./industrial-operational-continuity-realtime-publish.service";

const DISCLAIMER =
  "Couche continuité opérationnelle industrielle (18.7) — projection symbolique déterministe au-dessus de la situation room. États de stabilité, pressions et corridors sont consultatifs ; aucune exécution, aucun ordonnanceur, aucun moteur APS, aucun workflow ERP, aucun agent autonome, aucun mode conversationnel.";

const FULL_WARNING =
  "Full projection may attach upstream industrial-situation-room bundle mirror for audit/debug — not for default UI loads.";

const COST_LIVE =
  "Single upstream industrial-situation-room materialization per continuity readout (economic command compose at most once inside that path). Continuity synthesis adds deterministic stability, pressure, corridor, and cadence readouts only.";

const IOC_RELATION_TO_ISR =
  "Uses Situation Room outputs to summarize continuity, cadence, corridors and operational stability. It does not replace ISR.";

type Cached = { at: number; bundle: IndustrialOperationalContinuityBundle; sourceIsr: IndustrialSituationRoomBundle };

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

@Injectable()
export class IndustrialOperationalContinuityEngineService {
  private readonly cache = new Map<string, Cached>();
  private readonly inflight = new Map<string, Promise<void>>();
  private readonly ttlMs = 4200;

  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly situationRoom: IndustrialSituationRoomEngineService,
    private readonly realtime: IndustrialOperationalContinuityRealtimePublishService,
  ) {}

  async getBundleWithCacheMeta(
    organizationId: string,
    projection: IndustrialOperationalContinuityProjectionMode = "summary",
  ): Promise<{ bundle: IndustrialOperationalContinuityBundle; composeCacheHit: boolean }> {
    const now = Date.now();
    const enabled = await this.flags.isEnabled("industrial_operational_continuity_enabled", { organizationId });
    if (!enabled) {
      return { bundle: this.applyProjection(this.disabledBundle(organizationId), projection), composeCacheHit: false };
    }
    const isrOn = await this.flags.isEnabled("industrial_situation_room_enabled", { organizationId });
    const cmdOn = await this.flags.isEnabled("economic_command_enabled", { organizationId });
    const coordOn = await this.flags.isEnabled("economic_coordination_enabled", { organizationId });
    if (!isrOn || !cmdOn || !coordOn) {
      return {
        bundle: this.applyProjection(this.disabledBundle(organizationId, "upstream_dependency"), projection),
        composeCacheHit: false,
      };
    }

    const hit = this.cache.get(organizationId);
    if (hit && now - hit.at < this.ttlMs) {
      return {
        bundle: this.applyProjection(
          this.overlayCacheHit(hit.bundle),
          projection,
          projection === "full" ? hit.sourceIsr : undefined,
        ),
        composeCacheHit: true,
      };
    }

    const inflightKey = `${organizationId}::${projection}`;
    const wasInflight = this.inflight.has(inflightKey);
    if (!wasInflight) {
      this.inflight.set(
        inflightKey,
        (async () => {
          try {
            const { bundle: isr, composeCacheHit: isrHit } = await this.situationRoom.getBundleWithCacheMeta(
              organizationId,
              projection,
            );
            const bundle = this.materialize(organizationId, isr, isrHit);
            this.cache.set(organizationId, { at: Date.now(), bundle, sourceIsr: isr });
            const rtOn = await this.flags.isEnabled("industrial_operational_continuity_realtime_enabled", { organizationId });
            if (rtOn) void this.realtime.publishContinuityPulse(organizationId, bundle);
          } finally {
            this.inflight.delete(inflightKey);
          }
        })(),
      );
    }
    const wait = this.inflight.get(inflightKey)!;
    await wait;
    const cold = this.cache.get(organizationId);
    if (!cold) {
      throw new Error("IndustrialOperationalContinuityEngineService: cache empty after cold compose");
    }
    return {
      bundle: this.applyProjection(
        this.withInFlightReuse(cold.bundle, wasInflight),
        projection,
        projection === "full" ? cold.sourceIsr : undefined,
      ),
      composeCacheHit: false,
    };
  }

  private withInFlightReuse(bundle: IndustrialOperationalContinuityBundle, inFlightReuse: boolean): IndustrialOperationalContinuityBundle {
    return {
      ...bundle,
      diagnostics: {
        ...bundle.diagnostics,
        inFlightReuse,
      },
    };
  }

  private overlayCacheHit(bundle: IndustrialOperationalContinuityBundle): IndustrialOperationalContinuityBundle {
    return {
      ...bundle,
      diagnostics: { ...bundle.diagnostics, composeCacheHit: true, inFlightReuse: false },
    };
  }

  private disabledBundle(organizationId: string, reason?: "upstream_dependency"): IndustrialOperationalContinuityBundle {
    const ts = new Date().toISOString();
    const headline =
      reason === "upstream_dependency"
        ? "Operational continuity requires industrial_situation_room_enabled, economic_command_enabled, and economic_coordination_enabled."
        : "Industrial operational continuity disabled for this organization.";
    const zeroPlan: IndustrialOperationalContinuityComposePlan = {
      situationRoomMaterialization: 0,
      continuitySynthesis: 0,
      propagationCompose: 0,
      coordinationCompose: 0,
      scenariosCompose: 0,
      memoryCompose: 0,
      dataIntelligenceCompose: 0,
      commandCompose: 0,
      situationRoomSynthesis: 0,
    };
    const diag: IndustrialOperationalContinuityDiagnostics = {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      proxySignals: true,
      deterministicReadout: true,
      productRole: "CONTINUITY_LENS_ABOVE_SITUATION_ROOM",
      relationToSituationRoom: IOC_RELATION_TO_ISR,
      sourceMode: reason === "upstream_dependency" ? "DISABLED_UPSTREAM_DEPENDENCY" : "DISABLED",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      inFlightReuse: false,
      cacheStrategy: "SHORT_TTL_CONTINUITY_CACHE_WITH_SINGLE_FLIGHT",
      composeCount: 0,
      continuityComposePlan: zeroPlan,
      continuityComposeMeaning: "logical_pipeline_steps_not_cpu_cost",
      costDisclosure: "Layer disabled — no upstream situation-room materialization executed for this readout.",
      reusedBundles: [],
      sourceBundlesEmbedded: false,
      degradedMode: false,
      continuitySource: reason === "upstream_dependency" ? "DISABLED_UPSTREAM_DEPENDENCY" : "DISABLED",
      upstreamPropagationColdStarts: 0,
    };
    const snapshot: IndustrialOperationalContinuitySnapshot = {
      version: "1",
      generatedAt: ts,
      organizationId,
      continuitySource: "DISABLED",
      situationRoomDigest: {
        bundleGeneratedAt: ts,
        situationCellCount: 0,
        criticalDependencyCount: 0,
        missionCount: 0,
        globalStressProxy: 0,
        executivePosture: "UNKNOWN",
      },
      economicCommandDigest: { headline, pressureZoneCount: 0, globalStress: 0 },
    };
    const briefings: IndustrialOperationalContinuityBriefings = {
      executiveLines: [headline, "Couche continuité inactive — aucune lecture transverse matérialisée."],
      operationalLines: ["Aucune pression de continuité — cadence non calculée."],
      stabilizationLines: ["Aucun corridor critique — état désactivé."],
    };
    return {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "DISABLED",
      disclaimer: DISCLAIMER,
      snapshot,
      stabilityStates: [],
      continuityPressures: [],
      continuityCorridors: [],
      cadenceSignals: [],
      briefings,
      diagnostics: diag,
    };
  }

  private materialize(
    organizationId: string,
    isr: IndustrialSituationRoomBundle,
    isrComposeCacheHit: boolean,
  ): IndustrialOperationalContinuityBundle {
    const ts = new Date().toISOString();
    if (isr.policy === "DISABLED") {
      const degraded = this.disabledBundle(organizationId, "upstream_dependency");
      return {
        ...degraded,
        generatedAt: ts,
        organizationId,
        policy: "DISABLED",
        degraded: true,
        snapshot: {
          ...degraded.snapshot,
          continuitySource: "DISABLED_UPSTREAM_DEPENDENCY",
        },
        diagnostics: {
          ...degraded.diagnostics,
          degradedMode: true,
          costDisclosure: "Upstream situation room disabled — continuity projection empty; no secondary propagation invoked.",
          continuitySource: "DISABLED_UPSTREAM_DEPENDENCY",
        },
      };
    }

    const g = isr.snapshot.economicCommandDigest.globalStress;
    const urgencies = isr.situationCells.map((c) => c.urgency);
    const frags = isr.criticalDependencies.map((d) => d.fragility);
    const uAvg = avg(urgencies);
    const fAvg = avg(frags);
    const continuityScore = Number(
      Number(Math.min(1, Math.max(0, 1 - g * 0.55 - uAvg * 0.28 - fAvg * 0.12))).toFixed(4),
    );

    const states = this.buildStabilityStates(organizationId, continuityScore, g, uAvg, isr);
    const pressures = this.buildPressures(organizationId, isr);
    const corridors = this.buildCorridors(organizationId, isr);
    const cadence = this.buildCadence(organizationId, isr);
    const briefings = this.buildBriefings(isr, continuityScore);

    const isrPlan = isr.diagnostics.composePlan;
    const continuityComposePlan: IndustrialOperationalContinuityComposePlan = {
      situationRoomMaterialization: 1,
      continuitySynthesis: 1,
      propagationCompose: isrPlan.propagationCompose,
      coordinationCompose: isrPlan.coordinationCompose,
      scenariosCompose: isrPlan.scenariosCompose,
      memoryCompose: isrPlan.memoryCompose,
      dataIntelligenceCompose: isrPlan.dataIntelligenceCompose,
      commandCompose: isrPlan.commandCompose,
      situationRoomSynthesis: isrPlan.situationRoomSynthesis,
    };
    const composeCount =
      continuityComposePlan.situationRoomMaterialization +
      continuityComposePlan.continuitySynthesis +
      continuityComposePlan.propagationCompose +
      continuityComposePlan.coordinationCompose +
      continuityComposePlan.scenariosCompose +
      continuityComposePlan.memoryCompose +
      continuityComposePlan.dataIntelligenceCompose +
      continuityComposePlan.commandCompose +
      continuityComposePlan.situationRoomSynthesis;

    const diag: IndustrialOperationalContinuityDiagnostics = {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      proxySignals: true,
      deterministicReadout: true,
      productRole: "CONTINUITY_LENS_ABOVE_SITUATION_ROOM",
      relationToSituationRoom: IOC_RELATION_TO_ISR,
      sourceMode: "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      inFlightReuse: false,
      cacheStrategy: "SHORT_TTL_CONTINUITY_CACHE_WITH_SINGLE_FLIGHT",
      composeCount,
      continuityComposePlan,
      continuityComposeMeaning: "logical_pipeline_steps_not_cpu_cost",
      costDisclosure: COST_LIVE,
      reusedBundles: [
        "IndustrialSituationRoomEngineService.getBundleWithCacheMeta",
        "IndustrialOperationalContinuityEngineService.materialize",
      ],
      sourceBundlesEmbedded: false,
      degradedMode: Boolean(isr.degraded),
      continuitySource: "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
      upstreamPropagationColdStarts: isrComposeCacheHit ? 0 : isr.diagnostics.upstreamPropagationColdStarts,
    };

    const snapshot: IndustrialOperationalContinuitySnapshot = {
      version: "1",
      generatedAt: ts,
      organizationId,
      continuitySource: "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
      situationRoomDigest: {
        bundleGeneratedAt: isr.generatedAt,
        situationCellCount: isr.situationCells.length,
        criticalDependencyCount: isr.criticalDependencies.length,
        missionCount: isr.operationalMissions.length,
        globalStressProxy: g,
        executivePosture: isr.snapshot.economicCommandDigest.executivePosture,
      },
      economicCommandDigest: {
        headline: isr.snapshot.economicCommandDigest.headline,
        pressureZoneCount: isr.snapshot.economicCommandDigest.pressureZoneCount,
        globalStress: isr.snapshot.economicCommandDigest.globalStress,
      },
    };

    return {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "ACTIVE",
      disclaimer: DISCLAIMER,
      snapshot,
      stabilityStates: states,
      continuityPressures: pressures,
      continuityCorridors: corridors,
      cadenceSignals: cadence,
      briefings,
      diagnostics: diag,
      sourceMode: "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
      degraded: isr.degraded,
    };
  }

  private applyProjection(
    bundle: IndustrialOperationalContinuityBundle,
    projection: IndustrialOperationalContinuityProjectionMode,
    isr?: IndustrialSituationRoomBundle,
  ): IndustrialOperationalContinuityBundle {
    const sourceBundlesEmbedded = projection === "full";
    const diag: IndustrialOperationalContinuityDiagnostics = {
      ...bundle.diagnostics,
      projectionMode: projection,
      payloadWeightClass: sourceBundlesEmbedded ? "large" : "compact",
      sourceBundlesEmbedded,
    };
    if (projection === "full") {
      diag.fullProjectionWarning = FULL_WARNING;
    } else {
      delete (diag as { fullProjectionWarning?: string }).fullProjectionWarning;
    }
    const next: IndustrialOperationalContinuityBundle = { ...bundle, diagnostics: diag };
    if (sourceBundlesEmbedded && isr) {
      next.embeddedIndustrialSituationRoom = isr as unknown;
    } else {
      delete (next as { embeddedIndustrialSituationRoom?: unknown }).embeddedIndustrialSituationRoom;
    }
    return next;
  }

  private buildStabilityStates(
    org: string,
    continuityScore: number,
    globalStress: number,
    uAvg: number,
    isr: IndustrialSituationRoomBundle,
  ): OperationalStabilityState[] {
    const out: OperationalStabilityState[] = [];
    let i = 0;
    const push = (partial: Omit<OperationalStabilityState, "stateId" | "advisoryOnly" | "symbolicExecution">) => {
      i += 1;
      out.push({
        stateId: `ioc-st-${org.slice(0, 8)}-${i}`,
        advisoryOnly: true,
        symbolicExecution: true,
        ...partial,
      });
    };

    const hasStabMission = isr.operationalMissions.some((m) => m.missionType === "stabilization");
    let primary: OperationalStabilityState["stateType"] = "stable_continuity";
    if (continuityScore >= 0.72) primary = "stable_continuity";
    else if (continuityScore >= 0.52) primary = "pressured_continuity";
    else if (continuityScore >= 0.35) primary = "fragile_continuity";
    else if (hasStabMission && globalStress > 0.48) primary = "recovery_transition";
    else if (globalStress > 0.62 && uAvg > 0.5) primary = "overloaded_transition";
    else primary = "unstable_continuity";

    push({
      stateType: primary,
      continuityScore,
      volatility: Number(Math.min(1, uAvg * 0.65 + globalStress * 0.35).toFixed(4)),
      resilience: Number(Math.min(1, 0.4 + continuityScore * 0.55).toFixed(4)),
      operationalLoad: Number(Math.min(1, globalStress * 0.55 + isr.situationCells.length * 0.04).toFixed(4)),
      stabilizationCapacity: Number(
        Math.min(1, avg(isr.situationCells.map((c) => c.stabilizationPotential)) || 0.35).toFixed(4),
      ),
      sourceSignals: [
        "industrial_situation_room.snapshot.economicCommandDigest.globalStress",
        "industrial_situation_room.situationCells.urgency_avg",
      ],
      explanation:
        "État de continuité symbolique dérivé du digest situation room et des urgences cellulaires — lecture exécutive, non dispatch.",
    });

    if (isr.criticalDependencies.length >= 2 && primary === "pressured_continuity") {
      push({
        stateType: "fragile_continuity",
        continuityScore: Number((continuityScore * 0.92).toFixed(4)),
        volatility: Number(Math.min(1, avg(isr.criticalDependencies.map((d) => d.fragility)) + 0.08).toFixed(4)),
        resilience: Number((continuityScore * 0.85).toFixed(4)),
        operationalLoad: Number(Math.min(1, operationalLoadProxy(isr)).toFixed(4)),
        stabilizationCapacity: Number((continuityScore * 0.78).toFixed(4)),
        sourceSignals: ["industrial_situation_room.criticalDependencies.count"],
        explanation:
          "Sous-état fragile superposé lorsque plusieurs dépendances critiques sont présentes — corrélation consultative, non graphe physique.",
      });
    }

    return out.slice(0, 8);
  }

  private buildPressures(org: string, isr: IndustrialSituationRoomBundle): ContinuityPressure[] {
    const out: ContinuityPressure[] = [];
    let i = 0;
    const push = (partial: Omit<ContinuityPressure, "pressureId" | "advisoryOnly" | "symbolicExecution" | "heuristicOnly">) => {
      i += 1;
      out.push({
        pressureId: `ioc-pr-${org.slice(0, 8)}-${i}`,
        advisoryOnly: true,
        symbolicExecution: true,
        heuristicOnly: true,
        ...partial,
      });
    };

    const g = isr.snapshot.economicCommandDigest.globalStress;
    const dom = isr.snapshot.economicCommandDigest.dominantStress.toLowerCase();

    if (isr.situationCells.some((c) => c.cellType === "supply_recovery_cell")) {
      push({
        kind: "supply_continuity_pressure",
        intensity: Number(Math.min(1, g * 0.6 + 0.1).toFixed(4)),
        exposure: avg(isr.situationCells.filter((c) => c.cellType === "supply_recovery_cell").map((c) => c.urgency)),
        affectedPoles: ["supply_logistics"],
        sourceSignals: ["industrial_situation_room.situationCells.supply_recovery_cell"],
        explanation:
          "Pression continuité supply dérivée des cellules supply_recovery — proxy consultatif issu bundles situation room.",
      });
    }
    if (dom.includes("logistics") || isr.situationCells.some((c) => c.cellType === "distribution_watch_cell")) {
      push({
        kind: "logistics_continuity_pressure",
        intensity: Number(Math.min(1, g * 0.55).toFixed(4)),
        exposure: g,
        affectedPoles: ["supply_logistics", "order_adv"],
        sourceSignals: ["economic_command_digest.dominantStress", "industrial_situation_room.cells"],
        explanation:
          "Pression logistique symbolique — corrélation posture dominante / cellules distribution, non ETA réel.",
      });
    }
    if (isr.situationCells.some((c) => c.cellType === "liquidity_pressure_cell")) {
      push({
        kind: "financial_continuity_pressure",
        intensity: Number(Math.min(1, g * 0.58).toFixed(4)),
        exposure: avg(isr.situationCells.filter((c) => c.cellType === "liquidity_pressure_cell").map((c) => c.urgency)),
        affectedPoles: ["finance_collections"],
        sourceSignals: ["industrial_situation_room.situationCells.liquidity_pressure_cell"],
        explanation:
          "Pression continuité financière symbolique — agrégat liquidité proxy, non trésorerie opérationnelle.",
      });
    }
    if (isr.situationCells.some((c) => c.cellType === "strategic_alignment_cell")) {
      push({
        kind: "coordination_continuity_pressure",
        intensity: Number(Math.min(1, avg(isr.situationCells.filter((c) => c.cellType === "strategic_alignment_cell").map((c) => c.coordinationLoad)) + 0.05).toFixed(4)),
        exposure: g,
        affectedPoles: ["economic_coordination"],
        sourceSignals: ["industrial_situation_room.situationCells.strategic_alignment_cell"],
        explanation:
          "Pression coordination dérivée des cellules alignement — friction transverse consultative.",
      });
    }
    if (isr.situationCells.some((c) => c.cellType === "distribution_watch_cell")) {
      push({
        kind: "distribution_continuity_pressure",
        intensity: Number(Math.min(1, g * 0.52 + 0.06).toFixed(4)),
        exposure: avg(isr.situationCells.filter((c) => c.cellType === "distribution_watch_cell").map((c) => c.urgency)),
        affectedPoles: ["commercial_network", "supply_logistics"],
        sourceSignals: ["industrial_situation_room.situationCells.distribution_watch_cell"],
        explanation:
          "Pression distribution symbolique — densité relationnelle proxy, non ordre réseau.",
      });
    }
    if (isr.executiveAttention.some((a) => a.kind === "operational_saturation_warning" || a.kind === "cross_pole_overload_warning")) {
      push({
        kind: "industrial_saturation_pressure",
        intensity: Number(Math.min(1, g + 0.08).toFixed(4)),
        exposure: avg(isr.executiveAttention.map((a) => a.intensity)),
        affectedPoles: Array.from(new Set(isr.executiveAttention.flatMap((a) => a.affectedPoles))).slice(0, 8),
        sourceSignals: ["industrial_situation_room.executiveAttention.saturation_or_overload"],
        explanation:
          "Saturation industrielle proxy — agrégat signaux attention situation room, non capacité mesurée.",
      });
    }

    if (out.length === 0) {
      push({
        kind: "industrial_saturation_pressure",
        intensity: Number(Math.min(1, g + 0.02).toFixed(4)),
        exposure: g,
        affectedPoles: ["economic_command"],
        sourceSignals: ["industrial_situation_room.snapshot.globalStress_fallback"],
        explanation:
          "Pression continuité résiduelle dérivée du stress global digest — borne consultative lorsque aucune cellule spécialisée n’est émise.",
      });
    }

    return out.slice(0, 12);
  }

  private buildCorridors(org: string, isr: IndustrialSituationRoomBundle): CriticalContinuityCorridor[] {
    const out: CriticalContinuityCorridor[] = [];
    let i = 0;
    const mapKind = (k: string): CriticalContinuityCorridor["kind"] => {
      if (k === "upstream") return "fragile_operational_corridor";
      if (k === "downstream") return "overloaded_corridor";
      if (k === "fragile_bridge") return "unstable_bridge";
      if (k === "choke_point") return "continuity_choke_point";
      return "systemic_continuity_bottleneck";
    };
    for (const d of isr.criticalDependencies.slice(0, 10)) {
      i += 1;
      out.push({
        corridorId: `ioc-cr-${org.slice(0, 8)}-${i}`,
        kind: mapKind(d.kind),
        advisoryOnly: true,
        symbolicExecution: true,
        loadProxy: d.systemicExposure,
        fragility: d.fragility,
        involvedPoles: d.involvedPoles.slice(0, 8),
        sourceSignals: [`situation_room.criticalDependency.${d.dependencyId}`, ...d.sourceSignals.slice(0, 4)],
        explanation:
          "Corridor critique de continuité mappé depuis dépendance situation room — projection symbolique, non topologie réseau.",
      });
    }
    return out.slice(0, 16);
  }

  private buildCadence(org: string, isr: IndustrialSituationRoomBundle): OperationalCadenceSignal[] {
    const out: OperationalCadenceSignal[] = [];
    let i = 0;
    const push = (partial: Omit<OperationalCadenceSignal, "cadenceId" | "heuristicOnly" | "advisoryOnly" | "symbolicExecution">) => {
      i += 1;
      out.push({
        cadenceId: `ioc-cd-${org.slice(0, 8)}-${i}`,
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        ...partial,
      });
    };

    const g = isr.snapshot.economicCommandDigest.globalStress;
    const mW = avg(isr.operationalMissions.map((m) => m.operationalWeight));
    const scenarioProxy = isr.operationalMissions.some((m) => m.missionType === "escalation") ? 0.52 : g * 0.85;

    const cellUrgencyAvg = isr.situationCells.length > 0 ? avg(isr.situationCells.map((c) => c.urgency)) : 0;
    push({
      kind: "cadence_instability",
      intensity: Number(Math.min(1, cellUrgencyAvg * 0.55 + g * 0.35).toFixed(4)),
      sourceSignals: ["industrial_situation_room.situationCells.urgency", "economic_command_digest.globalStress"],
      explanation:
        "Instabilité de cadence proxy — combinaison déterministe urgences cellulaires et stress global, non horloge production.",
    });
    push({
      kind: "operational_rhythm_pressure",
      intensity: Number(Math.min(1, mW + g * 0.25).toFixed(4)),
      sourceSignals: ["industrial_situation_room.operationalMissions.operationalWeight_avg"],
      explanation:
        "Pression rythme opérationnel — agrégat poids missions symboliques situation room.",
    });
    push({
      kind: "recovery_latency",
      intensity: Number(
        Math.min(
          1,
          1 -
            (isr.situationCells.length > 0
              ? avg(isr.situationCells.map((c) => c.stabilizationPotential))
              : 0.35) +
            0.05,
        ).toFixed(4),
      ),
      sourceSignals: ["industrial_situation_room.situationCells.stabilizationPotential"],
      explanation:
        "Latence de récupération symbolique — inverse potentiel stabilisation cellulaire, non SLA.",
    });
    push({
      kind: "systemic_slowdown",
      intensity: Number(Math.min(1, g * 0.7 + scenarioProxy * 0.2).toFixed(4)),
      sourceSignals: [
        "economic_command_digest.globalStress",
        "industrial_situation_room.operationalMissions.escalation_presence",
      ],
      explanation:
        "Ralentissement systémique proxy — stress global et missions escalade prospective, lecture analytique.",
    });
    push({
      kind: "overload_accumulation",
      intensity: Number(Math.min(1, isr.executiveAttention.length * 0.12 + g * 0.4).toFixed(4)),
      sourceSignals: ["industrial_situation_room.executiveAttention.count", "economic_command_digest.globalStress"],
      explanation:
        "Accumulation surcharge symbolique — densité signaux attention exécutive situation room.",
    });

    return out.slice(0, 10);
  }

  private buildBriefings(isr: IndustrialSituationRoomBundle, continuityScore: number): IndustrialOperationalContinuityBriefings {
    const g = isr.snapshot.economicCommandDigest.globalStress.toFixed(2);
    const cs = continuityScore.toFixed(2);
    return {
      executiveLines: [
        `Continuité opérationnelle — score symbolique ${cs} (proxy 0–1).`,
        `Stress global amont ${g} — digest situation room ${isr.snapshot.economicCommandDigest.headline.slice(0, 120)}`,
        `Dépendances critiques ${isr.criticalDependencies.length} — corridors mappés en projection consultative.`,
      ],
      operationalLines: [
        `Cellules ${isr.situationCells.length} · missions ${isr.operationalMissions.length} — cadence dérivée, non planning APS.`,
        `Posture ${isr.snapshot.economicCommandDigest.executivePosture} — lecture transverse déterministe.`,
      ],
      stabilizationLines: [
        `Stabilisation symbolique — potentiels cellulaires agrégés, sans orchestrateur ni file d’exécution.`,
        `Heuristiques bornées — reproductibles pour audit direction réseau / supply.`,
      ],
    };
  }
}

function operationalLoadProxy(isr: IndustrialSituationRoomBundle): number {
  return Math.min(1, isr.snapshot.economicCommandDigest.globalStress * 0.5 + isr.situationCells.length * 0.04);
}
