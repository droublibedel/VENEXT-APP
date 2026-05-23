import { Injectable } from "@nestjs/common";
import type { EconomicCoordinationSnapshot, EconomicPosture, EconomicPostureCode } from "@venext/shared-contracts";

import {
  isFinanceShock,
  isRelationshipShock,
  isSupplyShock,
} from "./economic-coordination-shock-taxonomy";

const POSTURE_PRIORITY: EconomicPostureCode[] = [
  "SYSTEMIC_INSTABILITY",
  "MULTI_POLE_TENSION",
  "RELATIONSHIP_FRAGMENTATION",
  "LIQUIDITY_STRAIN",
  "DISTRIBUTION_SATURATION",
  "FRAGILE_GROWTH",
  "EXPANSION_PRESSURE",
  "RECOVERY_WINDOW",
  "STABLE",
];

@Injectable()
export class EconomicPostureService {
  derive(snapshot: EconomicCoordinationSnapshot): EconomicPosture {
    const r = snapshot.realtimePressure;
    const op = snapshot.operationalPressure;
    const fin = snapshot.financialPressure;
    const log = snapshot.logisticsPressure;
    const strat = snapshot.systemicIntelligencePressure;
    const org = snapshot.organizationSignals;
    const shocks = snapshot.propagationBundle.shocks;
    const territory = snapshot.propagationBundle.territoryFragility;
    const fragile = territory.filter((t) => t.fragilityScore > 0.38);
    const corrRows = snapshot.dataIntelligenceBundle.correlations.rows.length;

    const affinity: Record<EconomicPostureCode, { score: number; signals: string[] }> = {
      STABLE: { score: 1 - Math.max(r, op, fin, log, strat, org) * 0.85, signals: ["low_pressure_blend"] },
      EXPANSION_PRESSURE: {
        score: Number(((strat * 0.55 + op * 0.45) * (1 - fin * 0.25)).toFixed(4)),
        signals: ["systemicIntelligencePressure", "operationalPressure"],
      },
      FRAGILE_GROWTH: {
        score: Number(((op * 0.5 + org * 0.5) * (fragile.length > 0 ? 1 : 0.55)).toFixed(4)),
        signals: ["operationalPressure", "organizationSignals", "territoryFragility.count"],
      },
      LIQUIDITY_STRAIN: {
        score: Number((fin * 0.72 + (shocks.some((s) => /payment|finance|liquidity/i.test(s.type)) ? 0.18 : 0)).toFixed(4)),
        signals: ["financialPressure", "propagation_shock.lexicon"],
      },
      DISTRIBUTION_SATURATION: {
        score: Number((log * 0.65 + (shocks.some((s) => isSupplyShock(s)) ? 0.2 : 0)).toFixed(4)),
        signals: ["logisticsPressure", "propagation_shock.taxonomy"],
      },
      RELATIONSHIP_FRAGMENTATION: {
        score: Number(
          (
            (shocks.some((s) => /relationship|commercial|retail/i.test(s.sourcePole)) ? 0.35 : 0) +
            fragile.reduce((m, t) => Math.max(m, t.relationshipExposure), 0) * 0.55
          ).toFixed(4),
        ),
        signals: ["relationshipExposure.rollup", "shock.taxonomy"],
      },
      MULTI_POLE_TENSION: {
        score: Number((Math.min(1, corrRows / 10) * 0.55 + org * 0.45).toFixed(4)),
        signals: ["data_intelligence.correlation.count", "organizationSignals"],
      },
      RECOVERY_WINDOW: {
        score: Number(((1 - op) * 0.45 + (snapshot.scenariosBundle.overview.meanStabilizationProbability ?? 0) * 0.55).toFixed(4)),
        signals: ["inverse_operationalPressure", "scenarios.meanStabilizationProbability"],
      },
      SYSTEMIC_INSTABILITY: {
        score: Number((r * 0.38 + op * 0.32 + org * 0.3).toFixed(4)),
        signals: ["realtimePressure", "operationalPressure", "organizationSignals"],
      },
    };

    let best: EconomicPostureCode = "STABLE";
    let bestScore = -1;
    for (const code of POSTURE_PRIORITY) {
      const s = affinity[code].score;
      if (s > bestScore + 1e-6) {
        best = code;
        bestScore = s;
      }
    }

    if (best !== "STABLE" && bestScore < 0.22) {
      best = "STABLE";
      bestScore = affinity.STABLE.score;
    }

    const src = affinity[best].signals;
    const affectedPoles = [...new Set(shocks.map((s) => s.sourcePole))].sort();
    const affectedTerritories = fragile
      .map((t) => t.territory)
      .sort()
      .slice(0, 16);
    const systemicRisk = Number(Math.min(1, r * 0.55 + op * 0.45).toFixed(4));
    const coordinationStress = Number(Math.min(1, org * 0.4 + Math.min(1, corrRows / 12) * 0.35 + fin * 0.25).toFixed(4));
    const confidence = Number(Math.min(1, 0.35 + bestScore * 0.55 + (src.length > 1 ? 0.1 : 0)).toFixed(4));

    return {
      posture: best,
      confidence,
      systemicRisk,
      coordinationStress,
      explanation: `Posture ${best} selected by deterministic industrial affinity on propagation, scenarios, DI correlation density, and pressure scalars (18.4). Not autonomous; symbolic coordination readout only.`,
      sourceSignals: src,
      affectedPoles,
      affectedTerritories,
    };
  }
}
