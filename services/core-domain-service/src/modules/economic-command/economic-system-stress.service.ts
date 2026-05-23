import { Injectable } from "@nestjs/common";
import type { EconomicSystemStress } from "@venext/shared-contracts";

import type { EconomicCommandComposeContext } from "./economic-command.types";

@Injectable()
export class EconomicSystemStressService {
  build(ctx: EconomicCommandComposeContext): EconomicSystemStress {
    const p = ctx.propagationBundle.overview.systemicRiskRollup;
    const c = ctx.coordinationBundle.overview.coordinationStressRollup;
    const log = ctx.coordinationBundle.overview.logisticsPressure;
    const fin = ctx.coordinationBundle.overview.financialPressure;
    const rel = ctx.propagationBundle.territoryFragility.reduce((m, t) => Math.max(m, t.relationshipExposure), 0);
    const scen = ctx.scenariosBundle.overview.maxProjectedRisk ?? 0;
    const silentHint =
      ctx.propagationBundle.overview.shockCount > 0
        ? Math.min(1, ctx.propagationBundle.overview.shockCount / 20) * (1 - p) * 0.35
        : 0.08;

    const logisticsStress = Number(Math.min(1, log * 0.85 + p * 0.15).toFixed(4));
    const financialStress = Number(Math.min(1, fin * 0.9 + c * 0.1).toFixed(4));
    const relationshipStress = Number(Math.min(1, rel * 0.88).toFixed(4));
    const coordinationStress = Number(Math.min(1, c).toFixed(4));
    const scenarioStress = Number(Math.min(1, scen).toFixed(4));
    const silentStress = Number(Math.min(1, silentHint + rel * 0.12).toFixed(4));
    const globalStress = Number(
      Math.min(
        1,
        p * 0.28 +
          logisticsStress * 0.18 +
          financialStress * 0.18 +
          relationshipStress * 0.12 +
          coordinationStress * 0.12 +
          scenarioStress * 0.12,
      ).toFixed(4),
    );

    return {
      globalStress,
      logisticsStress,
      financialStress,
      relationshipStress,
      coordinationStress,
      silentStress,
      scenarioStress,
      stressMode: "PROXY_HEURISTIC",
      explanation:
        "All stress components are bounded proxy blends from propagation, coordination, scenarios, and territory rows — not calibrated industrial forecasting.",
      sourceSignals: [
        "propagation.overview.systemicRiskRollup",
        "coordination.overview.coordinationStressRollup",
        "scenarios.overview.maxProjectedRisk",
      ],
    };
  }
}
