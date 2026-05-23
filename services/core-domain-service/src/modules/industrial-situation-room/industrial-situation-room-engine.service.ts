import { Injectable } from "@nestjs/common";
import type {
  EconomicCommandBundle,
  IndustrialCriticalDependency,
  IndustrialExecutiveAttention,
  IndustrialOperationalMission,
  IndustrialSituationBriefings,
  IndustrialSituationCell,
  IndustrialSituationRoomBundle,
  IndustrialSituationRoomComposePlan,
  IndustrialSituationRoomDiagnostics,
  IndustrialSituationRoomProjectionMode,
  IndustrialSituationRoomSnapshot,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { EconomicCommandEngineService } from "../economic-command/economic-command-engine.service";
import { IndustrialSituationRoomRealtimePublishService } from "./industrial-situation-room-realtime-publish.service";

const DISCLAIMER =
  "Salle de situation industrielle (18.6) — projection symbolique déterministe au-dessus de la couche economic command. Lecture exécutive et cellules opérationnelles sont consultatives ; aucune exécution métier, aucun orchestrateur, aucun agent autonome, aucun assistant conversationnel.";

const FULL_PROJECTION_WARNING =
  "Full projection may attach upstream economic-command bundle mirror for audit/debug — not for default UI loads.";

const COST_LIVE =
  "Single upstream economic-command compose per situation-room materialization (propagation seeded once inside that pipeline). Situation-room synthesis adds deterministic symbolic cells, missions, dependencies, and attention readouts only.";

type CachedSituation = { at: number; bundle: IndustrialSituationRoomBundle; sourceCommand: EconomicCommandBundle };

@Injectable()
export class IndustrialSituationRoomEngineService {
  private readonly cache = new Map<string, CachedSituation>();
  private readonly ttlMs = 4200;

  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly economicCommand: EconomicCommandEngineService,
    private readonly realtime: IndustrialSituationRoomRealtimePublishService,
  ) {}

  async getBundleWithCacheMeta(
    organizationId: string,
    projection: IndustrialSituationRoomProjectionMode = "summary",
  ): Promise<{ bundle: IndustrialSituationRoomBundle; composeCacheHit: boolean }> {
    const now = Date.now();
    const enabled = await this.flags.isEnabled("industrial_situation_room_enabled", { organizationId });
    if (!enabled) {
      return { bundle: this.applyProjection(this.disabledBundle(organizationId), projection), composeCacheHit: false };
    }
    const cmdOn = await this.flags.isEnabled("economic_command_enabled", { organizationId });
    const coordOn = await this.flags.isEnabled("economic_coordination_enabled", { organizationId });
    if (!cmdOn || !coordOn) {
      return {
        bundle: this.applyProjection(this.disabledBundle(organizationId, "upstream_dependency"), projection),
        composeCacheHit: false,
      };
    }

    const cached = this.cache.get(organizationId);
    if (cached && now - cached.at < this.ttlMs) {
      return {
        bundle: this.applyProjection(
          this.overlayCacheHit(cached.bundle),
          projection,
          projection === "full" ? cached.sourceCommand : undefined,
        ),
        composeCacheHit: true,
      };
    }

    const { bundle: cmd, composeCacheHit: cmdHit } = await this.economicCommand.getBundleWithCacheMeta(
      organizationId,
      projection,
    );
    const bundle = this.materializeSituationRoom(organizationId, cmd, cmdHit);
    this.cache.set(organizationId, { at: now, bundle, sourceCommand: cmd });

    const rtOn = await this.flags.isEnabled("industrial_situation_room_realtime_enabled", { organizationId });
    if (rtOn) void this.realtime.publishSituationPulse(organizationId, bundle);

    return {
      bundle: this.applyProjection(bundle, projection, projection === "full" ? cmd : undefined),
      composeCacheHit: false,
    };
  }

  private overlayCacheHit(bundle: IndustrialSituationRoomBundle): IndustrialSituationRoomBundle {
    return {
      ...bundle,
      diagnostics: { ...bundle.diagnostics, composeCacheHit: true },
    };
  }

  private disabledBundle(organizationId: string, reason?: "upstream_dependency"): IndustrialSituationRoomBundle {
    const ts = new Date().toISOString();
    const headline =
      reason === "upstream_dependency"
        ? "Industrial situation room requires economic_command_enabled and economic_coordination_enabled."
        : "Industrial situation room disabled for this organization.";
    const zeroPlan: IndustrialSituationRoomComposePlan = {
      propagationCompose: 0,
      coordinationCompose: 0,
      scenariosCompose: 0,
      memoryCompose: 0,
      dataIntelligenceCompose: 0,
      commandCompose: 0,
      situationRoomSynthesis: 0,
    };
    const diag: IndustrialSituationRoomDiagnostics = {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      proxySignals: true,
      deterministicReadout: true,
      sourceMode: reason === "upstream_dependency" ? "DISABLED_UPSTREAM_DEPENDENCY" : "DISABLED",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      cacheStrategy: "SHORT_TTL_SITUATION_ROOM_CACHE",
      composeCount: 0,
      composePlan: zeroPlan,
      composeCountMeaning: "logical_pipeline_steps_not_cpu_cost",
      costDisclosure: "Layer disabled — no upstream economic-command compose executed for this readout.",
      reusedBundles: [],
      sourceBundlesEmbedded: false,
      degradedMode: false,
      snapshotSource: "DISABLED",
      upstreamPropagationColdStarts: 0,
    };
    const snapshot: IndustrialSituationRoomSnapshot = {
      version: "1",
      generatedAt: ts,
      organizationId,
      snapshotSource: "DISABLED",
      economicCommandDigest: {
        bundleGeneratedAt: ts,
        headline,
        pressureZoneCount: 0,
        riskCount: 0,
        arbitrationCount: 0,
        globalStress: 0,
        executivePosture: "UNKNOWN",
        dominantStress: "none",
      },
    };
    const briefings: IndustrialSituationBriefings = {
      executiveLines: [headline, "Couche situation room inactive — aucune lecture transverse matérialisée."],
      operationalLines: ["Aucune mission symbolique — dépendances non calculées."],
      stabilizationLines: ["Aucun plan de stabilisation symbolique — état désactivé."],
    };
    return {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "DISABLED",
      disclaimer: DISCLAIMER,
      snapshot,
      situationCells: [],
      operationalMissions: [],
      criticalDependencies: [],
      executiveAttention: [],
      briefings,
      diagnostics: diag,
    };
  }

  private materializeSituationRoom(
    organizationId: string,
    cmd: EconomicCommandBundle,
    cmdHit: boolean,
  ): IndustrialSituationRoomBundle {
    const generatedAt = new Date().toISOString();
    const cells = this.buildCells(organizationId, cmd);
    const missions = this.buildMissions(organizationId, cmd);
    const deps = this.buildDependencies(organizationId, cmd);
    const attention = this.buildAttention(organizationId, cmd);
    const briefings = this.buildBriefings(cmd);

    const cp = cmd.diagnostics.composePlan;
    const composePlan: IndustrialSituationRoomComposePlan = {
      propagationCompose: cp.propagationCompose,
      coordinationCompose: cp.coordinationCompose,
      scenariosCompose: cp.scenariosCompose,
      memoryCompose: cp.memoryCompose,
      dataIntelligenceCompose: cp.dataIntelligenceCompose,
      commandCompose: cp.commandCompose,
      situationRoomSynthesis: 1,
    };
    const composeCount =
      composePlan.propagationCompose +
      composePlan.coordinationCompose +
      composePlan.scenariosCompose +
      composePlan.memoryCompose +
      composePlan.dataIntelligenceCompose +
      composePlan.commandCompose +
      composePlan.situationRoomSynthesis;

    const upstreamPropagationColdStarts = cmdHit ? 0 : 1;

    const diag: IndustrialSituationRoomDiagnostics = {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      proxySignals: true,
      deterministicReadout: true,
      sourceMode: "LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      cacheStrategy: "SHORT_TTL_SITUATION_ROOM_CACHE",
      composeCount,
      composePlan,
      composeCountMeaning: "logical_pipeline_steps_not_cpu_cost",
      costDisclosure: COST_LIVE,
      reusedBundles: ["EconomicCommandEngineService.getBundleWithCacheMeta", "IndustrialSituationRoomEngineService.materializeSituationRoom"],
      sourceBundlesEmbedded: false,
      degradedMode: false,
      snapshotSource: "LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE",
      upstreamPropagationColdStarts,
    };

    const snapshot: IndustrialSituationRoomSnapshot = {
      version: "1",
      generatedAt,
      organizationId,
      snapshotSource: "LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE",
      economicCommandDigest: {
        bundleGeneratedAt: cmd.generatedAt,
        headline: cmd.overview.headline,
        pressureZoneCount: cmd.overview.pressureZoneCount,
        riskCount: cmd.overview.riskCount,
        arbitrationCount: cmd.overview.arbitrationCount,
        globalStress: cmd.systemStress.globalStress,
        executivePosture: cmd.overview.executivePosture,
        dominantStress: cmd.overview.dominantStress,
      },
    };

    return {
      version: "1",
      generatedAt,
      organizationId,
      policy: cmd.policy === "DISABLED" ? "DISABLED" : "ACTIVE",
      disclaimer: DISCLAIMER,
      snapshot,
      situationCells: cells,
      operationalMissions: missions,
      criticalDependencies: deps,
      executiveAttention: attention,
      briefings,
      diagnostics: diag,
      sourceMode: "LIVE_INDUSTRIAL_SITUATION_ROOM_COMPOSE",
    };
  }

  private applyProjection(
    bundle: IndustrialSituationRoomBundle,
    projection: IndustrialSituationRoomProjectionMode,
    cmd?: EconomicCommandBundle,
  ): IndustrialSituationRoomBundle {
    const sourceBundlesEmbedded = projection === "full";
    const diag: IndustrialSituationRoomDiagnostics = {
      ...bundle.diagnostics,
      projectionMode: projection,
      payloadWeightClass: sourceBundlesEmbedded ? "large" : "compact",
      sourceBundlesEmbedded,
    };
    if (projection === "full") {
      diag.fullProjectionWarning = FULL_PROJECTION_WARNING;
    } else {
      delete (diag as { fullProjectionWarning?: string }).fullProjectionWarning;
    }
    const next: IndustrialSituationRoomBundle = {
      ...bundle,
      diagnostics: diag,
    };
    if (sourceBundlesEmbedded && cmd) {
      next.embeddedEconomicCommand = cmd as unknown;
    } else {
      delete (next as { embeddedEconomicCommand?: unknown }).embeddedEconomicCommand;
    }
    return next;
  }

  private buildCells(org: string, cmd: EconomicCommandBundle): IndustrialSituationCell[] {
    const out: IndustrialSituationCell[] = [];
    let i = 0;
    const push = (partial: Omit<IndustrialSituationCell, "cellId" | "advisoryOnly" | "symbolicExecution">) => {
      i += 1;
      out.push({
        cellId: `isr-cell-${org.slice(0, 8)}-${i}`,
        advisoryOnly: true,
        symbolicExecution: true,
        ...partial,
      });
    };

    for (const z of cmd.pressureZones.slice(0, 8)) {
      const t = z.zoneType;
      if (t.includes("logistics")) {
        push({
          cellType: "supply_recovery_cell",
          confidence: Number(Math.min(1, z.pressureScore + 0.05).toFixed(4)),
          urgency: z.pressureScore,
          stabilizationPotential: Number((1 - z.pressureScore * 0.6).toFixed(4)),
          coordinationLoad: z.systemicWeight,
          affectedPoles: z.affectedPoles.slice(0, 8),
          sourceSignals: [...z.sourceSignals, `economic_command.pressureZones.${z.zoneId}`],
          explanation:
            "Cellule logistique symbolique dérivée des zones de pression command — coordination consultative, aucun dispatch.",
        });
      } else if (t.includes("silent_tension") || t.includes("silent")) {
        push({
          cellType: "crisis_cell",
          confidence: z.pressureScore,
          urgency: Number(Math.min(1, z.pressureScore * 1.05).toFixed(4)),
          stabilizationPotential: Number((0.55 + (1 - z.pressureScore) * 0.25).toFixed(4)),
          coordinationLoad: z.systemicWeight,
          affectedPoles: z.affectedPoles.slice(0, 8),
          sourceSignals: [...z.sourceSignals, `economic_command.pressureZones.${z.zoneId}`],
          explanation:
            "Cellule de situation dérivée d’une zone tension silencieuse — lecture pré-crise, signal faible, non alarme opérationnelle.",
        });
      } else if (t.includes("liquidity")) {
        push({
          cellType: "liquidity_pressure_cell",
          confidence: z.pressureScore,
          urgency: Number(Math.min(1, z.pressureScore * 0.95).toFixed(4)),
          stabilizationPotential: Number((0.5 + (1 - z.pressureScore) * 0.3).toFixed(4)),
          coordinationLoad: z.systemicWeight,
          affectedPoles: z.affectedPoles.slice(0, 8),
          sourceSignals: [...z.sourceSignals, `economic_command.pressureZones.${z.zoneId}`],
          explanation:
            "Pression liquidité symbolique — agrégat consultatif issu des proxies command, pas bilan trésorerie.",
        });
      } else if (t.includes("relationship")) {
        push({
          cellType: "distribution_watch_cell",
          confidence: z.pressureScore,
          urgency: z.systemicWeight,
          stabilizationPotential: Number((0.48 + (1 - z.pressureScore) * 0.35).toFixed(4)),
          coordinationLoad: z.systemicWeight,
          affectedPoles: z.affectedPoles.slice(0, 8),
          sourceSignals: [...z.sourceSignals, `economic_command.pressureZones.${z.zoneId}`],
          explanation:
            "Veille distribution symbolique — densité relationnelle proxy, pas ordre réseau.",
        });
      } else if (t.includes("coordination_conflict")) {
        push({
          cellType: "strategic_alignment_cell",
          confidence: z.pressureScore,
          urgency: z.pressureScore,
          stabilizationPotential: Number((0.42 + (1 - z.pressureScore) * 0.4).toFixed(4)),
          coordinationLoad: Number(Math.min(1, z.systemicWeight + 0.12).toFixed(4)),
          affectedPoles: z.affectedPoles.slice(0, 8),
          sourceSignals: [...z.sourceSignals, `economic_command.pressureZones.${z.zoneId}`],
          explanation:
            "Friction coordination matérialisée en cellule d’alignement stratégique — arbitrage analytique, non résolution automatique.",
        });
      }
    }

    if (cmd.systemStress.globalStress > 0.42) {
      push({
        cellType: "industrial_attention_cell",
        confidence: cmd.systemStress.globalStress,
        urgency: cmd.systemStress.coordinationStress,
        stabilizationPotential: Number((1 - cmd.systemStress.globalStress * 0.55).toFixed(4)),
        coordinationLoad: cmd.systemStress.coordinationStress,
        affectedPoles: ["supply_logistics", "finance_collections", "order_adv"],
        sourceSignals: ["economic_command.systemStress.globalStress", "economic_command.systemStress.coordinationStress"],
        explanation:
          "Saturation transverse proxy — focalisation industrielle symbolique sur lecture stress global command.",
      });
    }

    return out.slice(0, 12);
  }

  private buildMissions(org: string, cmd: EconomicCommandBundle): IndustrialOperationalMission[] {
    const out: IndustrialOperationalMission[] = [];
    let i = 0;
    const push = (partial: Omit<IndustrialOperationalMission, "missionCode" | "advisoryOnly" | "symbolicExecution">) => {
      i += 1;
      out.push({
        missionCode: `isr-msn-${org.slice(0, 8)}-${i}`,
        advisoryOnly: true,
        symbolicExecution: true,
        ...partial,
      });
    };

    if (cmd.systemStress.globalStress > 0.48) {
      push({
        missionType: "stabilization",
        operationalWeight: cmd.systemStress.globalStress,
        expectedImpact: Number((0.35 + cmd.systemStress.scenarioStress * 0.2).toFixed(4)),
        executionComplexity: cmd.systemStress.coordinationStress,
        stabilizationPriority: Number(Math.min(1, cmd.systemStress.globalStress + 0.08).toFixed(4)),
        affectedPoles: ["supply_logistics", "finance_collections"],
        sourceSignals: ["economic_command.systemStress.globalStress"],
        explanation:
          "Mission stabilisation symbolique — cadre d’attention exécutive sur chocs proxy ; aucune action supply chain.",
      });
    }
    if (cmd.decisionRisks.length > 0) {
      push({
        missionType: "containment",
        operationalWeight: Number(Math.min(1, cmd.decisionRisks.length * 0.12).toFixed(4)),
        expectedImpact: 0.4,
        executionComplexity: 0.55,
        stabilizationPriority: 0.5,
        affectedPoles: cmd.decisionRisks[0]!.impactedPoles.slice(0, 6),
        sourceSignals: cmd.decisionRisks[0]!.sourceSignals.slice(0, 8),
        explanation:
          "Mission confinement analytique — bornes consultatives sur risques décisionnels command, sans interdiction métier.",
      });
    }
    if (cmd.pressureZones.length > 0) {
      push({
        missionType: "monitoring",
        operationalWeight: Number(Math.min(1, cmd.pressureZones.length * 0.08).toFixed(4)),
        expectedImpact: 0.32,
        executionComplexity: 0.28,
        stabilizationPriority: 0.36,
        affectedPoles: Array.from(new Set(cmd.pressureZones.flatMap((z) => z.affectedPoles))).slice(0, 8),
        sourceSignals: ["economic_command.pressureZones.count", `economic_command.pressureZones:${cmd.pressureZones.length}`],
        explanation:
          "Mission veille symbolique — suivi densité zones de pression ; pas de ticketing ni d’escalade automatique.",
      });
    }
    if (cmd.systemStress.scenarioStress > 0.45) {
      push({
        missionType: "escalation",
        operationalWeight: cmd.systemStress.scenarioStress,
        expectedImpact: 0.38,
        executionComplexity: 0.62,
        stabilizationPriority: 0.44,
        affectedPoles: ["economic_scenarios_synthetic"],
        sourceSignals: ["economic_command.systemStress.scenarioStress"],
        explanation:
          "Mission escalade prospective symbolique — lecture scénarios intégrée au stress proxy ; non engagement directionnel.",
      });
    }
    if (cmd.arbitrations.length > 0) {
      push({
        missionType: "dependency_review",
        operationalWeight: Number(Math.min(1, cmd.arbitrations.length * 0.15).toFixed(4)),
        expectedImpact: 0.33,
        executionComplexity: 0.58,
        stabilizationPriority: 0.41,
        affectedPoles: cmd.arbitrations[0]!.involvedPoles.slice(0, 8),
        sourceSignals: ["economic_command.arbitrations.matrix"],
        explanation:
          "Mission revue dépendances analytiques — friction multi-pôles consultative, non arbitrage opérationnel.",
      });
    }

    return out.slice(0, 16);
  }

  private buildDependencies(org: string, cmd: EconomicCommandBundle): IndustrialCriticalDependency[] {
    const out: IndustrialCriticalDependency[] = [];
    let i = 0;
    const push = (partial: Omit<IndustrialCriticalDependency, "dependencyId" | "advisoryOnly" | "symbolicExecution">) => {
      i += 1;
      out.push({
        dependencyId: `isr-dep-${org.slice(0, 8)}-${i}`,
        advisoryOnly: true,
        symbolicExecution: true,
        ...partial,
      });
    };

    for (const z of cmd.pressureZones.slice(0, 6)) {
      const sig = z.sourceSignals.join("|");
      if (sig.includes("propagation")) {
        push({
          kind: "upstream",
          fragility: z.pressureScore,
          systemicExposure: z.systemicWeight,
          involvedPoles: z.affectedPoles.slice(0, 8),
          sourceSignals: z.sourceSignals.slice(0, 8),
          explanation:
            "Dépendance amont dérivée des signaux propagation présents dans les zones command — chaîne symbolique, non graphe physique.",
        });
      }
      if (sig.includes("coordination.conflict") || z.zoneType.includes("coordination_conflict")) {
        push({
          kind: "fragile_bridge",
          fragility: Number(Math.min(1, z.pressureScore + 0.08).toFixed(4)),
          systemicExposure: z.systemicWeight,
          involvedPoles: z.affectedPoles.slice(0, 8),
          sourceSignals: z.sourceSignals.slice(0, 8),
          explanation:
            "Pont fragile symbolique — friction coordination reflétée en dépendance critique consultative.",
        });
      }
    }

    const top = cmd.pressureZones[0];
    if (top) {
      push({
        kind: "choke_point",
        fragility: top.pressureScore,
        systemicExposure: top.systemicWeight,
        involvedPoles: top.affectedPoles.slice(0, 8),
        sourceSignals: [...top.sourceSignals, "economic_command.pressureZones.lead"],
        explanation:
          "Goulet symbolique sur zone dominante command — densité heuristique, pas capacité physique mesurée.",
      });
    }

    if (cmd.silentTensions.length >= 2) {
      push({
        kind: "systemic_bottleneck",
        fragility: Number(Math.min(1, cmd.silentTensions.length * 0.14).toFixed(4)),
        systemicExposure: cmd.systemStress.silentStress,
        involvedPoles: Array.from(new Set(cmd.silentTensions.flatMap((t) => t.affectedPoles))).slice(0, 8),
        sourceSignals: ["economic_command.silentTensions.count"],
        explanation:
          "Goulet systémique symbolique — accumulation tensions silencieuses proxy ; lecture transverse uniquement.",
      });
    }

    return out.slice(0, 20);
  }

  private buildAttention(org: string, cmd: EconomicCommandBundle): IndustrialExecutiveAttention[] {
    const out: IndustrialExecutiveAttention[] = [];
    let i = 0;
    const push = (partial: Omit<IndustrialExecutiveAttention, "attentionId" | "heuristicOnly" | "advisoryOnly" | "symbolicExecution">) => {
      i += 1;
      out.push({
        attentionId: `isr-attn-${org.slice(0, 8)}-${i}`,
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicExecution: true,
        ...partial,
      });
    };

    const posture = cmd.overview.executivePosture.toUpperCase();
    if (posture.includes("STRESS") || posture.includes("CRITICAL") || posture.includes("TENSE")) {
      push({
        kind: "executive_attention_zone",
        intensity: cmd.systemStress.globalStress,
        affectedPoles: ["economic_coordination", "economic_command"],
        sourceSignals: ["economic_command.overview.executivePosture"],
        explanation:
          "Zone attention exécutive — posture coordination stressée matérialisée en lecture cockpit ; non directive.",
      });
    }
    if (cmd.systemStress.globalStress > 0.55) {
      push({
        kind: "board_attention_alert",
        intensity: cmd.systemStress.globalStress,
        affectedPoles: ["finance_collections", "supply_logistics"],
        sourceSignals: ["economic_command.systemStress.globalStress"],
        explanation:
          "Alerte conseil symbolique — stress global proxy au-dessus du seuil de veille ; informationnel seulement.",
      });
    }
    if (cmd.systemStress.coordinationStress > 0.5) {
      push({
        kind: "operational_saturation_warning",
        intensity: cmd.systemStress.coordinationStress,
        affectedPoles: ["economic_coordination"],
        sourceSignals: ["economic_command.systemStress.coordinationStress"],
        explanation:
          "Avertissement saturation coordination — charge proxy ; pas de réallocation automatique.",
      });
    }
    const poleSet = new Set(cmd.pressureZones.flatMap((z) => z.affectedPoles));
    if (poleSet.size >= 3) {
      push({
        kind: "cross_pole_overload_warning",
        intensity: Number(Math.min(1, poleSet.size * 0.18).toFixed(4)),
        affectedPoles: Array.from(poleSet).slice(0, 12),
        sourceSignals: ["economic_command.pressureZones.crossPoleSpread"],
        explanation:
          "Surcharge multi-pôles symbolique — dispersion des zones de pression ; lecture transverse, pas orchestration.",
      });
    }

    return out.slice(0, 12);
  }

  private buildBriefings(cmd: EconomicCommandBundle): IndustrialSituationBriefings {
    const g = cmd.systemStress.globalStress.toFixed(2);
    const exec: string[] = [
      `Synthèse situation industrielle — stress global proxy ${g}.`,
      `Zones command matérialisées: ${cmd.pressureZones.length} — lecture symbolique non géographique.`,
      `Arbitrages analytiques: ${cmd.arbitrations.length} — exécution non opérationnelle.`,
    ];
    const ops: string[] = [
      `Posture coordination: ${cmd.overview.executivePosture} — digest ${cmd.overview.signalDigest.slice(0, 120)}`,
      `Risques consultatifs: ${cmd.decisionRisks.length} — avertissements, pas blocages automatiques.`,
    ];
    const stab: string[] = [
      `Stabilisation symbolique — potentiel dérivé des missions et cellules, sans plan d’action automatisé.`,
      `Projection déterministe — heuristiques bornées 0–1, reproductibles pour audit.`,
    ];
    return {
      executiveLines: exec.slice(0, 6),
      operationalLines: ops.slice(0, 6),
      stabilizationLines: stab.slice(0, 6),
    };
  }
}
