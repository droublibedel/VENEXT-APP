import { Injectable } from "@nestjs/common";
import type { CoordinationConflict, EconomicCoordinationSnapshot } from "@venext/shared-contracts";

import { isSupplyShock } from "./economic-coordination-shock-taxonomy";

@Injectable()
export class CoordinationConflictService {
  detect(snapshot: EconomicCoordinationSnapshot): CoordinationConflict[] {
    const out: CoordinationConflict[] = [];
    const org = snapshot.organizationId;
    const scenarios = snapshot.scenariosBundle.scenarios;

    let idx = 0;
    const push = (c: Omit<CoordinationConflict, "conflictId">) => {
      idx += 1;
      out.push({ ...c, conflictId: `coord-conflict-${org}-${idx}` });
    };

    for (const s of scenarios) {
      if (s.projectedRisk > 0.52 && s.stabilizationProbability > 0.62) {
        push({
          conflictType: "SCENARIO_STABILIZATION_VS_RISK",
          involvedPoles: [s.sourcePole, "COORDINATION_SYNTHETIC_RISK"].sort(),
          recommendationCollision: `Scenario ${s.scenarioCode} couples elevated projected risk with high stabilization probability — review sequencing before any real operational move.`,
          systemicImpact: Number(Math.min(1, (s.projectedRisk + s.stabilizationProbability) / 2).toFixed(4)),
          severity: Number(Math.min(1, s.projectedRisk * 0.55 + (1 - s.stabilizationProbability) * 0.45 + 0.15).toFixed(4)),
          arbitrationDirection: "Prefer explicit risk acceptance gates before stabilization narratives; keep finance and supply leads in the same arbitration thread (no automatic resolution).",
          diagnostics: ["rule:scenario_stabilization_vs_risk", `scenario:${s.scenarioCode}`],
        });
      }
    }

    const supplyPush = snapshot.propagationBundle.shocks.filter((sh) => isSupplyShock(sh)).length;
    const financeCaution = snapshot.financialPressure > 0.45;
    if (supplyPush >= 2 && financeCaution) {
      push({
        conflictType: "SUPPLY_ACCELERATION_VS_FINANCE_CAUTION",
        involvedPoles: ["SUPPLY_LOGISTICS", "FINANCE_COLLECTIONS"],
        recommendationCollision: "Propagation shows sustained supply-side shocks while finance pressure scalar is elevated — acceleration vs liquidity conservation may diverge.",
        systemicImpact: Number(Math.min(1, snapshot.logisticsPressure * 0.5 + snapshot.financialPressure * 0.5).toFixed(4)),
        severity: Number(Math.min(1, 0.35 + supplyPush * 0.07 + snapshot.financialPressure * 0.35).toFixed(4)),
        arbitrationDirection: "Sequence liquidity guardrails before distribution acceleration proposals; document explicit trade-offs (heuristic only).",
        diagnostics: ["rule:supply_vs_finance", `supplyShockHints:${supplyPush}`],
      });
    }

    if (snapshot.logisticsPressure > 0.48 && snapshot.systemicIntelligencePressure > 0.55) {
      push({
        conflictType: "DISTRIBUTION_SATURATION_VS_SYSTEMIC_INTELLIGENCE_PRESSURE",
        involvedPoles: ["SUPPLY_LOGISTICS", "DATA_INTELLIGENCE"],
        recommendationCollision:
          "Logistics saturation scalar conflicts with systemic intelligence pressure proxy from Data Intelligence economic propagation score (not a strategy-department signal).",
        systemicImpact: Number(
          Math.min(1, (snapshot.logisticsPressure + snapshot.systemicIntelligencePressure) / 2).toFixed(4),
        ),
        severity: Number(
          Math.min(1, 0.28 + snapshot.logisticsPressure * 0.4 + snapshot.systemicIntelligencePressure * 0.32).toFixed(4),
        ),
        arbitrationDirection:
          "Cap symbolic expansion narratives until congestion scalar relaxes; align marketing activation with supply feasibility reviews (manual).",
        diagnostics: ["rule:logistics_vs_systemic_intelligence_proxy"],
      });
    }

    out.sort((a, b) => b.severity - a.severity || a.conflictType.localeCompare(b.conflictType));
    return out.slice(0, 12);
  }
}
