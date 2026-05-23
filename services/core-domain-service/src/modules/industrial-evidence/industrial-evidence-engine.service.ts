import { Injectable } from "@nestjs/common";
import type {
  EconomicCommandBundle,
  EconomicCoordinationBundle,
  EconomicMemoryBundle,
  EconomicPropagationBundle,
  EconomicScenariosBundle,
  IndustrialEvidenceBundle,
  IndustrialEvidenceComposePlan,
  IndustrialEvidenceDiagnostics,
  IndustrialEvidenceRecord,
  IndustrialEvidenceScope,
  IndustrialEvidenceSnapshot,
  IndustrialEvidenceSourceMapEntry,
  IndustrialOperationalContinuityBundle,
  IndustrialSituationRoomBundle,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { EconomicCommandEngineService } from "../economic-command/economic-command-engine.service";
import { EconomicCoordinationEngineService } from "../economic-coordination/economic-coordination-engine.service";
import { EconomicMemoryService } from "../economic-memory/economic-memory.service";
import { EconomicPropagationEngineService } from "../economic-propagation/economic-propagation-engine.service";
import { EconomicScenariosEngineService } from "../economic-scenarios/economic-scenarios-engine.service";
import { IndustrialOperationalContinuityEngineService } from "../industrial-operational-continuity/industrial-operational-continuity-engine.service";
import { IndustrialSituationRoomEngineService } from "../industrial-situation-room/industrial-situation-room-engine.service";
import { IndustrialEvidenceRealtimePublishService } from "./industrial-evidence-realtime-publish.service";
import { IndustrialEvidenceTraceService } from "./industrial-evidence-trace.service";
import { IndustrialLimitationService } from "./industrial-limitation.service";
import { IndustrialTrustMatrixService } from "./industrial-trust-matrix.service";

const DISCLAIMER =
  "Couche preuve / traçabilité industrielle (18.8) — registre consultatif de provenance et de confiance. Aucune causalité juridique, aucun moteur de décision, aucune explication magique, aucun audit légal complet. Chaînes dérivées explicitement non causales.";

const HEURISTIC_CONFIDENCE_DISCLOSURE =
  "Heuristic confidence estimate — not a measured industrial quantity; ordinal proxy derived only from enumerated structural inputs (signal paths / flags), not from calibrated KPIs.";

type Cached = { at: number; bundle: IndustrialEvidenceBundle };

@Injectable()
export class IndustrialEvidenceEngineService {
  private readonly cache = new Map<string, Cached>();
  private readonly inflight = new Map<string, Promise<void>>();
  private readonly ttlMs = 4200;

  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly command: EconomicCommandEngineService,
    private readonly coordination: EconomicCoordinationEngineService,
    private readonly scenarios: EconomicScenariosEngineService,
    private readonly propagation: EconomicPropagationEngineService,
    private readonly memory: EconomicMemoryService,
    private readonly situationRoom: IndustrialSituationRoomEngineService,
    private readonly continuity: IndustrialOperationalContinuityEngineService,
    private readonly trust: IndustrialTrustMatrixService,
    private readonly traces: IndustrialEvidenceTraceService,
    private readonly limitations: IndustrialLimitationService,
    private readonly realtime: IndustrialEvidenceRealtimePublishService,
  ) {}

  async getBundleWithCacheMeta(
    organizationId: string,
    projection: "summary" | "full" = "summary",
  ): Promise<{ bundle: IndustrialEvidenceBundle; composeCacheHit: boolean }> {
    const enabled = await this.flags.isEnabled("industrial_evidence_enabled", { organizationId });
    if (!enabled) {
      return { bundle: this.disabledBundle(organizationId), composeCacheHit: false };
    }

    const now = Date.now();
    const hit = this.cache.get(organizationId);
    if (hit && now - hit.at < this.ttlMs) {
      return {
        bundle: this.applyProjection(hit.bundle, projection, { composeCacheHit: true }),
        composeCacheHit: true,
      };
    }

    const inflightKey = organizationId;
    const wasInflight = this.inflight.has(inflightKey);
    if (!wasInflight) {
      this.inflight.set(
        inflightKey,
        (async () => {
          try {
            const bundle = await this.materialize(organizationId);
            this.cache.set(organizationId, { at: Date.now(), bundle });
            const rtOn = await this.flags.isEnabled("industrial_evidence_realtime_enabled", { organizationId });
            if (rtOn) this.realtime.publishEvidencePulse(organizationId, bundle);
          } finally {
            this.inflight.delete(inflightKey);
          }
        })(),
      );
    }
    await this.inflight.get(inflightKey)!;
    const cold = this.cache.get(organizationId);
    if (!cold) throw new Error("IndustrialEvidenceEngineService: cache empty after compose");
    const bundle = this.withInFlightReuse(cold.bundle, wasInflight);
    return { bundle: this.applyProjection(bundle, projection), composeCacheHit: false };
  }

  private withInFlightReuse(bundle: IndustrialEvidenceBundle, inFlightReuse: boolean): IndustrialEvidenceBundle {
    return {
      ...bundle,
      snapshot: {
        ...bundle.snapshot,
        diagnostics: { ...bundle.snapshot.diagnostics, inFlightReuse },
      },
    };
  }

  private applyProjection(
    bundle: IndustrialEvidenceBundle,
    projection: "summary" | "full",
    opts?: { composeCacheHit?: boolean; inFlightReuse?: boolean },
  ): IndustrialEvidenceBundle {
    const embedded = projection === "full";
    const degraded = bundle.snapshot.diagnostics.degradedMode;
    const composeHit = opts?.composeCacheHit ?? bundle.snapshot.diagnostics.composeCacheHit;
    const bundleViewSemantic = degraded
      ? "DEGRADED_BUNDLE_VIEW"
      : composeHit
        ? "CACHE_REUSED_BUNDLE_VIEW"
        : "FULL_BUNDLE_VIEW";
    const diag: IndustrialEvidenceDiagnostics = {
      ...bundle.snapshot.diagnostics,
      projectionMode: projection,
      payloadWeightClass: embedded ? "large" : "compact",
      sourceBundlesEmbedded: embedded,
      composeCacheHit: composeHit,
      inFlightReuse: opts?.inFlightReuse ?? bundle.snapshot.diagnostics.inFlightReuse,
      degradedBundleMode: degraded,
      bundleViewSemantic,
    };
    const next: IndustrialEvidenceBundle = {
      ...bundle,
      snapshot: { ...bundle.snapshot, diagnostics: diag },
    };
    if (!embedded) delete next.embeddedSourceBundles;
    return next;
  }

  private disabledBundle(organizationId: string): IndustrialEvidenceBundle {
    const ts = new Date().toISOString();
    const zeroPlan: IndustrialEvidenceComposePlan = {
      economicCommandRead: 0,
      economicCoordinationRead: 0,
      economicScenariosRead: 0,
      economicPropagationRead: 0,
      economicMemoryRead: 0,
      industrialSituationRoomRead: 0,
      industrialOperationalContinuityRead: 0,
      dataIntelligenceReferencedViaPropagation: 0,
    };
    const diag: IndustrialEvidenceDiagnostics = {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      deterministicReadout: true,
      sourceMode: "DISABLED",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      inFlightReuse: false,
      cacheStrategy: "SHORT_TTL_EVIDENCE_CACHE_WITH_SINGLE_FLIGHT",
      evidenceComposePlan: zeroPlan,
      evidenceComposeMeaning: "logical_upstream_reads_not_cpu_cost",
      costDisclosure: "Industrial evidence disabled — no upstream reads executed.",
      degradedMode: false,
      sourceBundlesEmbedded: false,
      degradedBundleMode: true,
      bundleViewSemantic: "DEGRADED_BUNDLE_VIEW",
    };
    const scope: IndustrialEvidenceScope = {
      what_is_real: "Aucun agrégat actif — couche désactivée.",
      what_is_heuristic: "N/A (registre inactif).",
      what_is_symbolic: "N/A (registre inactif).",
      what_is_demo: "N/A (registre inactif).",
      what_is_missing: "Toutes les sources — flag industrial_evidence_enabled désactivé.",
    };
    const snap: IndustrialEvidenceSnapshot = {
      version: "1",
      generatedAt: ts,
      organizationId,
      headline: "Industrial evidence layer disabled.",
      records: [],
      trustMatrix: [],
      traces: [],
      limitations: [],
      sourceMap: [],
      diagnostics: diag,
      evidenceScope: scope,
      interpretationBoundary:
        "Registre désactivé — aucune interprétation transverse ne doit être tirée de cette réponse.",
      reliabilityBoundary: "Aucune fiabilité opérationnelle revendiquée — policy DISABLED.",
    };
    return {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "DISABLED",
      disclaimer: DISCLAIMER,
      snapshot: snap,
    };
  }

  private async materialize(organizationId: string): Promise<IndustrialEvidenceBundle> {
    const ts = new Date().toISOString();
    const plan: IndustrialEvidenceComposePlan = {
      economicCommandRead: 0,
      economicCoordinationRead: 0,
      economicScenariosRead: 0,
      economicPropagationRead: 0,
      economicMemoryRead: 0,
      industrialSituationRoomRead: 0,
      industrialOperationalContinuityRead: 0,
      dataIntelligenceReferencedViaPropagation: 0,
    };
    const upstreamFailures: string[] = [];
    const sourceMap: IndustrialEvidenceSourceMapEntry[] = [];
    const records: IndustrialEvidenceRecord[] = [];

    const gate = async (key: string) => this.flags.isEnabled(key, { organizationId });
    const summary = "summary" as const;

    let cmdB: EconomicCommandBundle | null = null;
    if (await gate("economic_command_enabled")) {
      plan.economicCommandRead = 1;
      try {
        cmdB = (await this.command.getBundleWithCacheMeta(organizationId, summary)).bundle;
        sourceMap.push(this.entry("ECONOMIC_COMMAND", true, cmdB));
        records.push(this.fromCommand(organizationId, cmdB, ts));
      } catch {
        upstreamFailures.push("economic_command");
        sourceMap.push(this.skip("ECONOMIC_COMMAND", "compose_failed"));
      }
    } else {
      sourceMap.push(this.skip("ECONOMIC_COMMAND", "flag_off"));
    }

    let coordB: EconomicCoordinationBundle | null = null;
    if (await gate("economic_coordination_enabled")) {
      plan.economicCoordinationRead = 1;
      try {
        coordB = (await this.coordination.getBundleWithCacheMeta(organizationId, summary)).bundle;
        sourceMap.push(this.entry("ECONOMIC_COORDINATION", true, coordB));
        records.push(this.fromCoordination(organizationId, coordB, ts));
      } catch {
        upstreamFailures.push("economic_coordination");
        sourceMap.push(this.skip("ECONOMIC_COORDINATION", "compose_failed"));
      }
    } else {
      sourceMap.push(this.skip("ECONOMIC_COORDINATION", "flag_off"));
    }

    let scenB: EconomicScenariosBundle | null = null;
    if (await gate("economic_scenarios_enabled")) {
      plan.economicScenariosRead = 1;
      try {
        scenB = (await this.scenarios.getBundleWithCacheMeta(organizationId)).bundle;
        sourceMap.push(this.entry("ECONOMIC_SCENARIOS", true, scenB));
        records.push(this.fromScenarios(organizationId, scenB, ts));
      } catch {
        upstreamFailures.push("economic_scenarios");
        sourceMap.push(this.skip("ECONOMIC_SCENARIOS", "compose_failed"));
      }
    } else {
      sourceMap.push(this.skip("ECONOMIC_SCENARIOS", "flag_off"));
    }

    let propB: EconomicPropagationBundle | null = null;
    if (await gate("economic_propagation_enabled")) {
      plan.economicPropagationRead = 1;
      try {
        propB = await this.propagation.compose(organizationId, false);
        if (propB.upstreamDataIntelligenceBundle) plan.dataIntelligenceReferencedViaPropagation = 1;
        sourceMap.push(this.entry("ECONOMIC_PROPAGATION", true, propB));
        records.push(this.fromPropagation(organizationId, propB, ts));
      } catch {
        upstreamFailures.push("economic_propagation");
        sourceMap.push(this.skip("ECONOMIC_PROPAGATION", "compose_failed"));
      }
    } else {
      sourceMap.push(this.skip("ECONOMIC_PROPAGATION", "flag_off"));
    }

    let memB: EconomicMemoryBundle | null = null;
    if (await gate("economic_memory_enabled")) {
      plan.economicMemoryRead = 1;
      try {
        memB = await this.memory.composeBundle(organizationId);
        sourceMap.push(this.entry("ECONOMIC_MEMORY", true, memB));
        records.push(this.fromMemory(organizationId, memB, ts));
      } catch {
        upstreamFailures.push("economic_memory");
        sourceMap.push(this.skip("ECONOMIC_MEMORY", "compose_failed"));
      }
    } else {
      sourceMap.push(this.skip("ECONOMIC_MEMORY", "flag_off"));
    }

    let isrB: IndustrialSituationRoomBundle | null = null;
    if (await gate("industrial_situation_room_enabled")) {
      plan.industrialSituationRoomRead = 1;
      try {
        isrB = (await this.situationRoom.getBundleWithCacheMeta(organizationId, summary)).bundle;
        sourceMap.push(this.entry("INDUSTRIAL_SITUATION_ROOM", true, isrB));
        records.push(this.fromSituationRoom(organizationId, isrB, ts));
      } catch {
        upstreamFailures.push("industrial_situation_room");
        sourceMap.push(this.skip("INDUSTRIAL_SITUATION_ROOM", "compose_failed"));
      }
    } else {
      sourceMap.push(this.skip("INDUSTRIAL_SITUATION_ROOM", "flag_off"));
    }

    let iocB: IndustrialOperationalContinuityBundle | null = null;
    if (await gate("industrial_operational_continuity_enabled")) {
      plan.industrialOperationalContinuityRead = 1;
      try {
        iocB = (await this.continuity.getBundleWithCacheMeta(organizationId, summary)).bundle;
        sourceMap.push(this.entry("INDUSTRIAL_OPERATIONAL_CONTINUITY", true, iocB));
        records.push(this.fromContinuity(organizationId, iocB, ts));
      } catch {
        upstreamFailures.push("industrial_operational_continuity");
        sourceMap.push(this.skip("INDUSTRIAL_OPERATIONAL_CONTINUITY", "compose_failed"));
      }
    } else {
      sourceMap.push(this.skip("INDUSTRIAL_OPERATIONAL_CONTINUITY", "flag_off"));
    }

    for (const r of records) {
      r.trustLevel = this.trust.classifyRecord(r);
    }

    const traceOn = await gate("industrial_evidence_trace_enabled");
    const limOn = await gate("industrial_evidence_limitations_enabled");
    const traces = this.traces.buildTraces(records, organizationId, traceOn);
    const limitations = limOn ? this.limitations.build(records, organizationId, sourceMap) : [];
    const trustMatrix = this.trust.buildMatrix(records, organizationId);

    const reads =
      plan.economicCommandRead +
      plan.economicCoordinationRead +
      plan.economicScenariosRead +
      plan.economicPropagationRead +
      plan.economicMemoryRead +
      plan.industrialSituationRoomRead +
      plan.industrialOperationalContinuityRead;
    const diag: IndustrialEvidenceDiagnostics = {
      heuristicOnly: true,
      advisoryOnly: true,
      symbolicProjection: true,
      nonOperationalExecution: true,
      deterministicReadout: true,
      sourceMode: upstreamFailures.length ? "DISABLED_PARTIAL_UPSTREAM" : "LIVE_INDUSTRIAL_EVIDENCE_COMPOSE",
      projectionMode: "summary",
      payloadWeightClass: "compact",
      composeCacheHit: false,
      inFlightReuse: false,
      cacheStrategy: "SHORT_TTL_EVIDENCE_CACHE_WITH_SINGLE_FLIGHT",
      evidenceComposePlan: plan,
      evidenceComposeMeaning: "logical_upstream_reads_not_cpu_cost",
      costDisclosure: `Industrial evidence compose performed ${reads} upstream bundle read(s); upstream projection fixed to summary to avoid redundant full payloads. Data intelligence is referenced only when embedded on propagation bundle — no duplicate DI compose from evidence layer.`,
      degradedMode: upstreamFailures.length > 0,
      sourceBundlesEmbedded: false,
      upstreamFailures: upstreamFailures.length ? upstreamFailures : undefined,
      degradedBundleMode: upstreamFailures.length > 0,
      bundleViewSemantic: upstreamFailures.length > 0 ? "DEGRADED_BUNDLE_VIEW" : "FULL_BUNDLE_VIEW",
    };

    const evidenceScope = this.buildEvidenceScope(sourceMap, upstreamFailures);
    const interpretationBoundary =
      "Boundary: registry describes advisory compose alignment — not forensic proof, not ERP ground truth, not causal production claims.";
    const reliabilityBoundary =
      "Reliability: bounded to upstream bundle materialization in this TTL window; heuristic confidence values are ordinal estimates from structural inputs only.";

    const snap: IndustrialEvidenceSnapshot = {
      version: "1",
      generatedAt: ts,
      organizationId,
      headline: `Industrial evidence registry — ${records.length} provenance row(s), ${trustMatrix.length} trust scope(s), ${traces.length} derived trace(s).`,
      records: records.slice(0, 64),
      trustMatrix,
      traces,
      limitations,
      sourceMap,
      diagnostics: diag,
      evidenceScope,
      interpretationBoundary,
      reliabilityBoundary,
    };

    const bundle: IndustrialEvidenceBundle = {
      version: "1",
      generatedAt: ts,
      organizationId,
      policy: "ACTIVE",
      disclaimer: DISCLAIMER,
      snapshot: snap,
    };

    const embedded: Record<string, unknown> = {};
    if (cmdB) embedded.economicCommand = cmdB;
    if (coordB) embedded.economicCoordination = coordB;
    if (scenB) embedded.economicScenarios = scenB;
    if (propB) embedded.economicPropagation = propB;
    if (memB) embedded.economicMemory = memB;
    if (isrB) embedded.industrialSituationRoom = isrB;
    if (iocB) embedded.industrialOperationalContinuity = iocB;
    if (Object.keys(embedded).length) bundle.embeddedSourceBundles = embedded;

    return bundle;
  }

  private buildEvidenceScope(
    sourceMap: IndustrialEvidenceSourceMapEntry[],
    upstreamFailures: string[],
  ): IndustrialEvidenceScope {
    const skipped = sourceMap.filter((e) => !e.included);
    const missingList = skipped.map((s) => `${s.poleKey}:${s.skippedReason ?? "unknown"}`).join("; ") || "none";
    return {
      what_is_real:
        "Materialized upstream bundles when sourceMap.included=true — advisory readouts from existing engines, not direct sensor/MES feeds.",
      what_is_heuristic:
        "Rows marked heuristicConfidence=true — ordinal estimates from structural input enumeration only (see confidenceInputs / confidenceDerivedFrom).",
      what_is_symbolic:
        "Symbolic presentation layers (maps, cells, corridors) carried by upstream bundles — not surveyed geography or plant state.",
      what_is_demo:
        "Rows with demoOrSynthetic=true — synthetic or demo-origin signals; excluded from operational trust buckets.",
      what_is_missing: `Skipped or failed poles: ${missingList}. Upstream failure keys: ${upstreamFailures.length ? upstreamFailures.join(", ") : "none"}.`,
    };
  }

  private heuristicConfidenceFromInputs(
    inputs: string[],
    derivedKey: string,
  ): Pick<
    IndustrialEvidenceRecord,
    "confidence" | "heuristicConfidence" | "confidenceDerivedFrom" | "confidenceInputs" | "confidenceHeuristic"
  > {
    const n = Math.min(inputs.length, 12);
    const confidence = Number(Math.min(0.62, 0.38 + n * 0.03).toFixed(3));
    return {
      confidence,
      heuristicConfidence: true,
      confidenceDerivedFrom: derivedKey,
      confidenceInputs: inputs.slice(0, 16),
      confidenceHeuristic: HEURISTIC_CONFIDENCE_DISCLOSURE,
    };
  }

  private entry(
    poleKey: string,
    ok: boolean,
    b: { version: string; generatedAt: string },
  ): IndustrialEvidenceSourceMapEntry {
    return {
      poleKey,
      included: ok,
      bundleVersion: b.version,
      bundleGeneratedAt: b.generatedAt,
      composeHint: "Upstream bundle materialized via existing engine (summary projection).",
      sourceFreshness: "FROM_BUNDLE_TIMESTAMP",
      sourceReliability: "UPSTREAM_ROW_OK",
      sourceCompleteness: "ROW_OK",
      sourceAvailability: "AVAILABLE",
    };
  }

  private skip(poleKey: string, reason: string): IndustrialEvidenceSourceMapEntry {
    const flagOff = reason === "flag_off";
    const composeFail = reason === "compose_failed";
    return {
      poleKey,
      included: false,
      composeHint: "Skipped",
      skippedReason: reason,
      sourceFreshness: "NOT_INCLUDED",
      sourceReliability: flagOff ? "FLAG_DISABLED" : composeFail ? "UPSTREAM_COMPOSE_FAILED" : "UNKNOWN",
      sourceCompleteness: "ROW_SKIP",
      sourceAvailability: flagOff ? "UNAVAILABLE_FLAG" : composeFail ? "UNAVAILABLE_COMPOSE" : "UNAVAILABLE_UNKNOWN",
    };
  }

  private fromCommand(org: string, b: EconomicCommandBundle, ts: string): IndustrialEvidenceRecord {
    const d = b.diagnostics as {
      heuristicOnly?: boolean;
      advisoryOnly?: boolean;
      symbolicProjection?: boolean;
      proxySignals?: boolean;
    };
    const sourceSignals = ["economic_command.diagnostics", "economic_command.overview.headline"];
    const hc = this.heuristicConfidenceFromInputs(
      [
        ...sourceSignals,
        `upstream.heuristicOnly=${Boolean(d.heuristicOnly ?? true)}`,
        `upstream.symbolicProjection=${Boolean(d.symbolicProjection ?? true)}`,
        `upstream.proxySignals=${String(d.proxySignals ?? "n/a")}`,
      ],
      "venext.evidence.economic_command.diagnostic_flags_and_signal_paths_v1",
    );
    return {
      evidenceId: `iev-ecmd-${org.slice(0, 8)}`,
      evidenceType: "COMMAND_DERIVED",
      sourcePole: "ECONOMIC_COMMAND",
      sourceBundle: "EconomicCommandBundle",
      sourceService: "EconomicCommandEngineService.getBundleWithCacheMeta",
      sourceSignals,
      derivedFrom: ["EconomicPropagationEngineService (via command compose path)"],
      ...hc,
      trustLevel: "WEAK_HEURISTIC",
      explanation: "Command executive digest — heuristic advisory readout, not operational dispatch.",
      limitations: "Scores are bounded proxies — not calibrated KPIs.",
      createdAt: ts,
      advisoryOnly: true,
      heuristicOnly: Boolean(d.heuristicOnly ?? true),
      symbolicProjection: Boolean(d.symbolicProjection ?? true),
      demoOrSynthetic: false,
    };
  }

  private fromCoordination(org: string, b: EconomicCoordinationBundle, ts: string): IndustrialEvidenceRecord {
    const sourceSignals = ["economic_coordination.diagnostics.sourceMode"];
    const hc = this.heuristicConfidenceFromInputs(
      [...sourceSignals, `bundle.version=${b.version}`],
      "venext.evidence.economic_coordination.signal_paths_v1",
    );
    return {
      evidenceId: `iev-ecrd-${org.slice(0, 8)}`,
      evidenceType: "COORDINATION_DERIVED",
      sourcePole: "ECONOMIC_COORDINATION",
      sourceBundle: "EconomicCoordinationBundle",
      sourceService: "EconomicCoordinationEngineService.getBundleWithCacheMeta",
      sourceSignals,
      derivedFrom: ["EconomicPropagationEngineService", "EconomicScenariosEngineService"],
      ...hc,
      trustLevel: "WEAK_HEURISTIC",
      explanation: "Coordination posture matrix — symbolic arbitration readout.",
      limitations: "No execution path — documentation only.",
      createdAt: ts,
      advisoryOnly: true,
      heuristicOnly: true,
      symbolicProjection: true,
      demoOrSynthetic: false,
    };
  }

  private fromScenarios(org: string, b: EconomicScenariosBundle, ts: string): IndustrialEvidenceRecord {
    const sourceSignals = ["economic_scenarios.scenarios"];
    const hc = this.heuristicConfidenceFromInputs(
      [...sourceSignals, `bundle.version=${b.version}`],
      "venext.evidence.economic_scenarios.signal_paths_v1",
    );
    return {
      evidenceId: `iev-escn-${org.slice(0, 8)}`,
      evidenceType: "SCENARIO_DERIVED",
      sourcePole: "ECONOMIC_SCENARIOS",
      sourceBundle: "EconomicScenariosBundle",
      sourceService: "EconomicScenariosEngineService.getBundleWithCacheMeta",
      sourceSignals,
      derivedFrom: ["EconomicPropagationEngineService"],
      ...hc,
      trustLevel: "WEAK_HEURISTIC",
      explanation: "Scenario lattice — prospective framing, not forecast guarantee.",
      limitations: "Scenario-derived — treat as sensitivity lens.",
      createdAt: ts,
      advisoryOnly: true,
      heuristicOnly: true,
      symbolicProjection: true,
      demoOrSynthetic: false,
    };
  }

  private fromPropagation(org: string, b: EconomicPropagationBundle, ts: string): IndustrialEvidenceRecord {
    const di = Boolean(b.upstreamDataIntelligenceBundle);
    const sourceSignals = ["propagation.shocks", "propagation.chains", di ? "upstreamDataIntelligenceBundle" : "no_di_embed"];
    const hc = this.heuristicConfidenceFromInputs(
      [...sourceSignals, `bundle.version=${b.version}`, `di.embedded=${di}`],
      "venext.evidence.economic_propagation.signal_paths_v1",
    );
    return {
      evidenceId: `iev-eprp-${org.slice(0, 8)}`,
      evidenceType: di ? "DATA_INTELLIGENCE_DERIVED" : "PROPAGATION_DERIVED",
      sourcePole: "ECONOMIC_PROPAGATION",
      sourceBundle: "EconomicPropagationBundle",
      sourceService: "EconomicPropagationEngineService.compose",
      sourceSignals,
      derivedFrom: ["DataIntelligenceDataService.loadCrossCut", "DataIntelligenceBundleService (optional)"],
      ...hc,
      trustLevel: "WEAK_HEURISTIC",
      explanation: di
        ? "Propagation bundle embeds data-intelligence mirror — DI not recomposed separately by evidence layer."
        : "Propagation shocks/chains — cross-pole heuristics.",
      limitations: di ? "DI snapshot may be stale vs live warehouse systems." : "Propagation heuristics only.",
      createdAt: ts,
      advisoryOnly: true,
      heuristicOnly: true,
      symbolicProjection: true,
      demoOrSynthetic: false,
    };
  }

  private fromMemory(org: string, b: EconomicMemoryBundle, ts: string): IndustrialEvidenceRecord {
    const sourceSignals = ["economic_memory.crisisSignatures", "economic_memory.shockPatterns"];
    const hc = this.heuristicConfidenceFromInputs(
      [...sourceSignals, `bundle.version=${b.version}`],
      "venext.evidence.economic_memory.signal_paths_v1",
    );
    return {
      evidenceId: `iev-emem-${org.slice(0, 8)}`,
      evidenceType: "MEMORY_DERIVED",
      sourcePole: "ECONOMIC_MEMORY",
      sourceBundle: "EconomicMemoryBundle",
      sourceService: "EconomicMemoryService.composeBundle",
      sourceSignals,
      derivedFrom: ["EconomicMemoryStorageService"],
      ...hc,
      trustLevel: "WEAK_HEURISTIC",
      explanation: "Memory persistence readout — historical patterns, not live sensor feed.",
      limitations: "Temporal lag possible — stale_snapshot_limit may apply.",
      createdAt: ts,
      advisoryOnly: true,
      heuristicOnly: true,
      symbolicProjection: true,
      demoOrSynthetic: false,
    };
  }

  private fromSituationRoom(org: string, b: IndustrialSituationRoomBundle, ts: string): IndustrialEvidenceRecord {
    const sourceSignals = ["industrial_situation_room.diagnostics", "situationCells"];
    const hc = this.heuristicConfidenceFromInputs(
      [...sourceSignals, `bundle.version=${b.version}`],
      "venext.evidence.industrial_situation_room.signal_paths_v1",
    );
    return {
      evidenceId: `iev-isr-${org.slice(0, 8)}`,
      evidenceType: "SITUATION_ROOM_DERIVED",
      sourcePole: "INDUSTRIAL_SITUATION_ROOM",
      sourceBundle: "IndustrialSituationRoomBundle",
      sourceService: "IndustrialSituationRoomEngineService.getBundleWithCacheMeta",
      sourceSignals,
      derivedFrom: ["EconomicCommandEngineService"],
      ...hc,
      trustLevel: "WEAK_HEURISTIC",
      explanation: "Situation room symbolic cockpit — cells and missions are advisory projections.",
      limitations: "Symbolic projection — not MES state.",
      createdAt: ts,
      advisoryOnly: true,
      heuristicOnly: true,
      symbolicProjection: true,
      demoOrSynthetic: false,
    };
  }

  private fromContinuity(org: string, b: IndustrialOperationalContinuityBundle, ts: string): IndustrialEvidenceRecord {
    const sourceSignals = ["industrial_operational_continuity.diagnostics.continuityComposePlan"];
    const hc = this.heuristicConfidenceFromInputs(
      [...sourceSignals, `bundle.version=${b.version}`],
      "venext.evidence.industrial_operational_continuity.signal_paths_v1",
    );
    return {
      evidenceId: `iev-ioc-${org.slice(0, 8)}`,
      evidenceType: "CONTINUITY_DERIVED",
      sourcePole: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
      sourceBundle: "IndustrialOperationalContinuityBundle",
      sourceService: "IndustrialOperationalContinuityEngineService.getBundleWithCacheMeta",
      sourceSignals,
      derivedFrom: ["IndustrialSituationRoomEngineService"],
      ...hc,
      trustLevel: "WEAK_HEURISTIC",
      explanation: "Continuity lens above ISR — same upstream materialization cost disclosure echoed.",
      limitations: "Continuity scores are narrative proxies.",
      createdAt: ts,
      advisoryOnly: true,
      heuristicOnly: true,
      symbolicProjection: true,
      demoOrSynthetic: false,
    };
  }
}
