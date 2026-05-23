import { Injectable } from "@nestjs/common";
import type { EconomicPropagationBundle } from "@venext/shared-contracts";

export type ScenarioMemoryContext = {
  eventDepth30d: number;
  signatureHints: string[];
  patternTypes: string[];
  /** Compose-level prefetch: last N memory event types (any), used by scenario memory link — avoids per-scenario DB reads. */
  recentMemoryEventTypes?: string[];
  memoryPrefetch?: boolean;
  memoryPrefetchCount?: number;
  memoryReuseStrategy?: "COMPOSE_LEVEL_MEMORY_CONTEXT";
};

export type GeneratedScenarioCore = {
  scenarioCode: string;
  scenarioType: string;
  triggerType: string;
  severity: string;
  sourcePole: string;
  confidence: number;
  affectedPoles: string[];
  affectedTerritories: string[];
  projectedRisk: number;
  stabilizationProbability: number;
  estimatedPropagationDepth: number;
  metadata: Record<string, unknown>;
};

const SCENARIO_TYPES = [
  "supply_disruption",
  "payment_collapse",
  "territory_instability",
  "distributor_fragmentation",
  "campaign_overheating",
  "logistics_blockage",
  "liquidity_stress",
  "network_breakdown",
  "trust_erosion",
] as const;

/** FNV-1a 32-bit — deterministic from seed string (Instruction 18.3: no RNG). */
function fnv1a32(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function det01(seed: string): number {
  return fnv1a32(seed) / 4294967296;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

@Injectable()
export class ScenarioGenerationService {
  generate(ctx: {
    organizationId: string;
    bundle: EconomicPropagationBundle;
    memory: ScenarioMemoryContext;
  }): GeneratedScenarioCore[] {
    const { organizationId, bundle, memory } = ctx;
    const rollup = bundle.overview.systemicRiskRollup;
    const memW = clamp(memory.eventDepth30d / 160 + memory.signatureHints.length * 0.04, 0, 0.22);

    return SCENARIO_TYPES.map((scenarioType) => {
      const seed = `${organizationId}|${bundle.generatedAt}|${scenarioType}`;
      const d = det01(seed);
      const base = this.baseStressForType(scenarioType, bundle, d);
      const projectedRisk = clamp(base * (1 + memW * 0.35) + rollup * 0.25, 0, 0.98);
      const stabilizationProbability = clamp(
        0.92 - projectedRisk * 0.55 + (bundle.territoryFragility[0]?.resilienceScore ?? 0.2) * 0.12,
        0.05,
        0.94,
      );
      const estimatedPropagationDepth = Math.min(
        12,
        Math.max(0, Math.round(bundle.chains.reduce((m, c) => Math.max(m, c.propagationDepth), 0) * (0.55 + d * 0.35))),
      );
      const severity =
        projectedRisk > 0.78 ? "CRITICAL" : projectedRisk > 0.55 ? "HIGH" : projectedRisk > 0.35 ? "MODERATE" : "LOW";
      const confidence = clamp(0.42 + d * 0.28 + (memory.patternTypes.length > 0 ? 0.08 : 0), 0.35, 0.9);
      const scenarioCode = `scn_${scenarioType}_${fnv1a32(seed).toString(16).slice(0, 10)}`;
      const triggerType = this.triggerForType(scenarioType, bundle);
      const sourcePole = this.sourcePoleForType(scenarioType);
      const { affectedPoles, affectedTerritories } = this.affectedSets(scenarioType, bundle);

      return {
        scenarioCode,
        scenarioType,
        triggerType,
        severity,
        sourcePole,
        confidence: Number(confidence.toFixed(3)),
        affectedPoles,
        affectedTerritories,
        projectedRisk: Number(projectedRisk.toFixed(3)),
        stabilizationProbability: Number(stabilizationProbability.toFixed(3)),
        estimatedPropagationDepth,
        metadata: {
          provenance: [
            "economic_propagation_engine.compose",
            memory.eventDepth30d ? "economic_event_memories.count_30d" : "economic_memory_sparse",
            memory.signatureHints.length ? "economic_crisis_signatures.recent" : "economic_crisis_signatures.none",
          ],
          syntheticProjection: true,
          notFinancialForecast: true,
          memoryStressWeight: Number(memW.toFixed(3)),
        },
      };
    });
  }

  private triggerForType(t: string, bundle: EconomicPropagationBundle): string {
    if (t === "payment_collapse" || t === "liquidity_stress")
      return bundle.simulationPreview.triggerType || "liquidity_collapse";
    if (t === "supply_disruption" || t === "logistics_blockage") return "shipment_delayed";
    if (t === "campaign_overheating") return "marketing_pressure";
    if (t === "territory_instability") return bundle.territoryFragility[0]?.territory ? "territory_stress" : "territory_unknown";
    if (t === "distributor_fragmentation") return "relationship_fragmentation";
    if (t === "network_breakdown") return bundle.chains.length > 4 ? "multi_chain_saturation" : "cross_pole_stress";
    if (t === "trust_erosion") return "negotiation_stall";
    return "cross_pole_stress";
  }

  private sourcePoleForType(t: string): string {
    const map: Record<string, string> = {
      supply_disruption: "supply_logistics",
      logistics_blockage: "supply_logistics",
      payment_collapse: "finance_collections",
      liquidity_stress: "finance_collections",
      territory_instability: "data_intelligence",
      distributor_fragmentation: "commercial_network",
      campaign_overheating: "marketing_activation",
      network_breakdown: "data_intelligence",
      trust_erosion: "commercial_network",
    };
    return map[t] ?? "data_intelligence";
  }

  private baseStressForType(t: string, bundle: EconomicPropagationBundle, d: number): number {
    const shocks = bundle.shocks;
    const frag = bundle.territoryFragility;
    const maxFrag = frag.reduce((m, r) => Math.max(m, r.fragilityScore), 0);
    switch (t) {
      case "supply_disruption":
        return clamp(0.22 + maxFrag * 0.35 + shocks.filter((s) => s.sourcePole === "supply_logistics").length * 0.06 + d * 0.08, 0, 1);
      case "logistics_blockage":
        return clamp(0.28 + (shocks.some((s) => s.type.includes("blocked")) ? 0.22 : 0) + maxFrag * 0.3 + d * 0.1, 0, 1);
      case "payment_collapse":
        return clamp(0.25 + shocks.filter((s) => s.type.includes("liquidity") || s.type.includes("payment")).length * 0.08 + d * 0.12, 0, 1);
      case "liquidity_stress":
        return clamp(0.2 + shocks.filter((s) => s.type.includes("liquidity")).length * 0.1 + d * 0.15, 0, 1);
      case "territory_instability":
        return clamp(0.18 + maxFrag * 0.55 + frag.filter((x) => x.fragilityScore > 0.45).length * 0.05, 0, 1);
      case "distributor_fragmentation":
        return clamp(0.2 + shocks.filter((s) => s.type.includes("relationship") || s.type.includes("fragment")).length * 0.12 + d * 0.1, 0, 1);
      case "campaign_overheating": {
        const act = bundle.territoryFragility.reduce((s, r) => s + r.activationExposure, 0) / Math.max(1, bundle.territoryFragility.length);
        const mk = bundle.shocks.filter((s) => s.sourcePole.includes("marketing")).length;
        return clamp(0.15 + act * 0.5 + mk * 0.12 + d * 0.1, 0, 1);
      }
      case "network_breakdown": {
        const chainStress = bundle.chains.length ? bundle.chains.reduce((m, c) => Math.max(m, c.systemicRiskScore), 0) : 0;
        return clamp(0.18 + chainStress * 0.35 + d * 0.12, 0, 1);
      }
      case "trust_erosion":
        return clamp(0.18 + shocks.filter((s) => s.type.includes("trust") || s.type.includes("negotiation")).length * 0.1 + d * 0.12, 0, 1);
      default:
        return clamp(0.2 + d * 0.2, 0, 1);
    }
  }

  private affectedSets(
    t: string,
    bundle: EconomicPropagationBundle,
  ): { affectedPoles: string[]; affectedTerritories: string[] } {
    const poles = new Set<string>();
    const terr = new Set<string>();
    for (const s of bundle.shocks) {
      s.affectedPoles.forEach((p) => poles.add(p));
      s.affectedTerritories.forEach((x) => terr.add(x));
    }
    for (const row of bundle.territoryFragility.slice(0, 6)) {
      terr.add(row.territory);
    }
    if (t.includes("supply") || t === "logistics_blockage") {
      poles.add("supply_logistics");
      poles.add("order_adv");
    }
    if (t.includes("payment") || t.includes("liquidity")) {
      poles.add("finance_collections");
      poles.add("order_adv");
    }
    if (t === "campaign_overheating") poles.add("marketing_activation");
    if (t === "distributor_fragmentation" || t === "trust_erosion") poles.add("commercial_network");
    return {
      affectedPoles: [...poles].slice(0, 16),
      affectedTerritories: [...terr].slice(0, 24),
    };
  }
}
