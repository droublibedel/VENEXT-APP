import { Injectable } from "@nestjs/common";
import type { EconomicPressureZone, EconomicSilentTension } from "@venext/shared-contracts";

import type { EconomicCommandComposeContext } from "./economic-command.types";

export type EconomicPressureZoneBuildOpts = {
  silentTensions: EconomicSilentTension[];
  silentStress: number;
};

@Injectable()
export class EconomicPressureZoneService {
  build(ctx: EconomicCommandComposeContext, opts: EconomicPressureZoneBuildOpts): EconomicPressureZone[] {
    const org = ctx.organizationId;
    const zones: EconomicPressureZone[] = [];
    let idx = 0;
    const push = (z: Omit<EconomicPressureZone, "heuristicOnly">) => {
      idx += 1;
      zones.push({ ...z, heuristicOnly: true as const });
    };

    const logRoll = ctx.propagationBundle.territoryFragility.reduce((m, t) => Math.max(m, t.logisticsExposure), 0);
    if (logRoll > 0.22) {
      push({
        zoneId: `ecmd-zone-log-${org.slice(0, 8)}-${idx}`,
        zoneType: "logistics_pressure_zone",
        label: "Logistics corridor pressure",
        pressureScore: Number(Math.min(1, logRoll * 0.85 + ctx.propagationBundle.overview.systemicRiskRollup * 0.15).toFixed(4)),
        systemicWeight: Number(Math.min(1, ctx.propagationBundle.overview.systemicRiskRollup).toFixed(4)),
        affectedPoles: ["supply_logistics", "order_adv"],
        affectedTerritories: ctx.propagationBundle.territoryFragility
          .filter((t) => t.logisticsExposure > 0.2)
          .map((t) => t.territory)
          .slice(0, 8),
        sourceSignals: ["propagation.territoryFragility.logisticsExposure", "propagation.overview.systemicRiskRollup"],
        explanation:
          "Heuristic zone from propagation territory logistics exposure — advisory readout only; not a dispatch instruction.",
      });
    }

    const finSig = ctx.memoryBundle.crisisSignatures?.length
      ? ctx.memoryBundle.crisisSignatures.reduce((s, c) => s + c.systemicRisk, 0) / ctx.memoryBundle.crisisSignatures.length
      : ctx.coordinationBundle.overview.financialPressure;
    if (finSig > 0.18) {
      push({
        zoneId: `ecmd-zone-liq-${org.slice(0, 8)}-${idx}`,
        zoneType: "liquidity_pressure_zone",
        label: "Liquidity / receivable pressure",
        pressureScore: Number(Math.min(1, finSig * 0.9).toFixed(4)),
        systemicWeight: Number(Math.min(1, ctx.coordinationBundle.overview.coordinationStressRollup).toFixed(4)),
        affectedPoles: ["finance_collections", "order_adv"],
        affectedTerritories: [],
        sourceSignals: ["economic_memory.crisisSignatures", "coordination.overview.financialPressure"],
        explanation: "Proxy liquidity scalar from memory crisis signatures and coordination financial pressure — not treasury advice.",
      });
    }

    const relExp = ctx.propagationBundle.territoryFragility.reduce((m, t) => Math.max(m, t.relationshipExposure), 0);
    if (relExp > 0.2) {
      push({
        zoneId: `ecmd-zone-rel-${org.slice(0, 8)}-${idx}`,
        zoneType: "relationship_pressure_zone",
        label: "Relationship-field stress",
        pressureScore: Number(Math.min(1, relExp * 0.88).toFixed(4)),
        systemicWeight: Number(Math.min(1, relExp * 0.55 + ctx.propagationBundle.overview.shockCount / 18).toFixed(4)),
        affectedPoles: ["commercial_network", "marketing_activation"],
        affectedTerritories: [],
        sourceSignals: ["propagation.territoryFragility.relationshipExposure"],
        explanation: "Heuristic relationship exposure rollup — symbolic coordination only.",
      });
    }

    const fragileTop = ctx.propagationBundle.overview.territoryFragileTop ?? 0;
    if (fragileTop > 0) {
      push({
        zoneId: `ecmd-zone-ter-${org.slice(0, 8)}-${idx}`,
        zoneType: "territory_fragility_zone",
        label: "Territory fragility concentration",
        pressureScore: Number(Math.min(1, fragileTop / 10 + ctx.propagationBundle.overview.systemicRiskRollup * 0.35).toFixed(4)),
        systemicWeight: Number(Math.min(1, ctx.propagationBundle.overview.systemicRiskRollup).toFixed(4)),
        affectedPoles: ["supply_logistics", "finance_collections"],
        affectedTerritories: ctx.propagationBundle.territoryFragility
          .filter((t) => t.fragilityScore > 0.32)
          .map((t) => t.territory)
          .slice(0, 8),
        sourceSignals: ["propagation.overview.territoryFragileTop", "propagation.territoryFragility.fragilityScore"],
        explanation: "Territory fragility count blended with systemic risk rollup — not a geographic incident map.",
      });
    }

    for (const c of ctx.coordinationBundle.conflicts.slice(0, 3)) {
      push({
        zoneId: `ecmd-zone-cc-${c.conflictId}`,
        zoneType: "coordination_conflict_zone",
        label: `Coordination tension — ${c.conflictType}`,
        pressureScore: Number(Math.min(1, c.severity).toFixed(4)),
        systemicWeight: Number(Math.min(1, c.systemicImpact).toFixed(4)),
        affectedPoles: c.involvedPoles,
        affectedTerritories: [],
        sourceSignals: ["coordination.conflict.matrix", `conflict:${c.conflictType}`],
        explanation: c.recommendationCollision.slice(0, 280),
      });
    }

    const maxScenarioRisk = ctx.scenariosBundle.overview.maxProjectedRisk ?? 0;
    if (maxScenarioRisk > 0.42) {
      push({
        zoneId: `ecmd-zone-sc-${org.slice(0, 8)}-${idx}`,
        zoneType: "scenario_escalation_zone",
        label: "Scenario risk lattice elevation",
        pressureScore: Number(Math.min(1, maxScenarioRisk).toFixed(4)),
        systemicWeight: Number(Math.min(1, maxScenarioRisk * 0.7 + ctx.scenariosBundle.overview.scenarioCount * 0.02).toFixed(4)),
        affectedPoles: ["economic_scenarios_synthetic"],
        affectedTerritories: [],
        sourceSignals: ["scenarios.overview.maxProjectedRisk", "scenarios.overview.scenarioCount"],
        explanation: "Prospective scenario risk scalar — not a forecast commitment.",
      });
    }

    const maxSilentIntensity =
      opts.silentTensions.length > 0 ? Math.max(...opts.silentTensions.map((t) => t.intensity), 0) : 0;
    const silentStress = Number(Math.min(1, opts.silentStress).toFixed(4));
    const hiSilentStress = silentStress >= 0.36;
    const hiSilentTension = opts.silentTensions.some((t) => t.intensity >= 0.32);
    const manySilent = opts.silentTensions.length >= 2;
    if (hiSilentStress || hiSilentTension || manySilent) {
      const pressureScore = Number(
        Math.min(1, Math.max(silentStress, maxSilentIntensity, manySilent ? 0.34 : 0)).toFixed(4),
      );
      push({
        zoneId: `ecmd-zone-st-${org.slice(0, 8)}-${idx}`,
        zoneType: "silent_tension_zone",
        label: "Silent tension / micro-signal field",
        pressureScore,
        systemicWeight: Number(Math.min(1, silentStress * 0.55 + maxSilentIntensity * 0.45).toFixed(4)),
        affectedPoles: Array.from(
          new Set(opts.silentTensions.flatMap((t) => t.affectedPoles).slice(0, 8)),
        ).slice(0, 16),
        affectedTerritories: Array.from(
          new Set(opts.silentTensions.flatMap((t) => t.affectedTerritories).slice(0, 8)),
        ).slice(0, 16),
        sourceSignals: [
          "command.systemStress.silentStress",
          "command.silentTensions.intensity",
          `command.silentTensions.count:${opts.silentTensions.length}`,
        ],
        explanation:
          "Early-warning proxy: weak-signal / pre-crisis tension field from silent stress and silent-tension heuristics — not an alarm system and not dispatch authority.",
      });
    }

    zones.sort((a, b) => b.pressureScore - a.pressureScore || a.zoneType.localeCompare(b.zoneType));
    return zones.slice(0, 16);
  }
}
