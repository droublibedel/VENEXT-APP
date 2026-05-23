import { Injectable } from "@nestjs/common";
import type { EconomicSilentTension } from "@venext/shared-contracts";

import type { EconomicCommandComposeContext } from "./economic-command.types";

@Injectable()
export class EconomicSilentTensionService {
  build(ctx: EconomicCommandComposeContext): EconomicSilentTension[] {
    const org = ctx.organizationId;
    const out: EconomicSilentTension[] = [];
    let idx = 0;
    const push = (t: Omit<EconomicSilentTension, "heuristicOnly">) => {
      idx += 1;
      out.push({ ...t, heuristicOnly: true as const });
    };

    if (ctx.coordinationBundle.overview.financialPressure > 0.22 && ctx.coordinationBundle.overview.financialPressure < 0.42) {
      push({
        tensionId: `ecmd-st-slow-liq-${org.slice(0, 8)}-${idx}`,
        tensionType: "slow_liquidity_drift",
        intensity: Number(ctx.coordinationBundle.overview.financialPressure.toFixed(4)),
        confidence: 0.48,
        affectedPoles: ["finance_collections"],
        affectedTerritories: [],
        sourceSignals: ["coordination.overview.financialPressure"],
        explanation: "Financial pressure proxy in mid-band — watch receivable discipline without alarm thresholds yet.",
      });
    }

    if (ctx.coordinationBundle.overview.logisticsPressure > 0.25 && ctx.coordinationBundle.overview.logisticsPressure < 0.45) {
      push({
        tensionId: `ecmd-st-sup-${org.slice(0, 8)}-${idx}`,
        tensionType: "delayed_supply_pressure",
        intensity: Number(ctx.coordinationBundle.overview.logisticsPressure.toFixed(4)),
        confidence: 0.5,
        affectedPoles: ["supply_logistics"],
        affectedTerritories: [],
        sourceSignals: ["coordination.overview.logisticsPressure"],
        explanation: "Logistics scalar building but below saturation heuristic — corridor monitoring only.",
      });
    }

    const rel = ctx.propagationBundle.territoryFragility.reduce((m, t) => Math.max(m, t.relationshipExposure), 0);
    if (rel > 0.14 && rel < 0.34) {
      push({
        tensionId: `ecmd-st-trust-${org.slice(0, 8)}-${idx}`,
        tensionType: "relationship_trust_erosion",
        intensity: Number(rel.toFixed(4)),
        confidence: 0.46,
        affectedPoles: ["commercial_network"],
        affectedTerritories: [],
        sourceSignals: ["propagation.territoryFragility.relationshipExposure"],
        explanation: "Relationship exposure creeping — not yet a declared coordination conflict.",
      });
    }

    if (ctx.coordinationBundle.overview.operationalPressure > 0.4 && ctx.coordinationBundle.overview.realtimePressure < 0.35) {
      push({
        tensionId: `ecmd-st-mkt-${org.slice(0, 8)}-${idx}`,
        tensionType: "marketing_overactivation_risk",
        intensity: Number(Math.min(1, ctx.coordinationBundle.overview.operationalPressure * 0.72).toFixed(4)),
        confidence: 0.44,
        affectedPoles: ["marketing_activation", "order_adv"],
        affectedTerritories: [],
        sourceSignals: ["coordination.overview.operationalPressure", "coordination.overview.realtimePressure"],
        explanation: "Operational scenario pressure decoupled from realtime shock density — review activation cadence.",
      });
    }

    if (ctx.coordinationBundle.priorities.length > 4 && ctx.coordinationBundle.conflicts.length === 0) {
      push({
        tensionId: `ecmd-st-noise-${org.slice(0, 8)}-${idx}`,
        tensionType: "coordination_noise",
        intensity: 0.28,
        confidence: 0.4,
        affectedPoles: ["coordination_synthetic"],
        affectedTerritories: [],
        sourceSignals: ["coordination.priorities.length"],
        explanation: "Many symbolic priorities without surfaced conflicts — possible narrative noise; human triage.",
      });
    }

    const memN = ctx.memoryBundle.propagationHistoryPreview?.length ?? 0;
    const scenN = ctx.scenariosBundle.overview.scenarioCount ?? 0;
    if (memN > 6 && scenN > 4) {
      push({
        tensionId: `ecmd-st-mem-${org.slice(0, 8)}-${idx}`,
        tensionType: "scenario_memory_mismatch",
        intensity: Number(Math.min(1, 0.22 + memN * 0.015).toFixed(4)),
        confidence: 0.42,
        affectedPoles: ["economic_memory", "economic_scenarios"],
        affectedTerritories: [],
        sourceSignals: ["economic_memory.propagationHistoryPreview.length", "scenarios.overview.scenarioCount"],
        explanation: "Temporal memory density vs scenario lattice breadth — align steering narratives manually.",
      });
    }

    out.sort((a, b) => b.intensity - a.intensity || a.tensionType.localeCompare(b.tensionType));
    return out.slice(0, 14);
  }
}
