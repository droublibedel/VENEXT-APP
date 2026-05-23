import { Injectable } from "@nestjs/common";
import type { EconomicDecisionRisk } from "@venext/shared-contracts";

import type { EconomicCommandComposeContext } from "./economic-command.types";

@Injectable()
export class EconomicDecisionRiskService {
  build(ctx: EconomicCommandComposeContext): EconomicDecisionRisk[] {
    const org = ctx.organizationId;
    const out: EconomicDecisionRisk[] = [];
    let idx = 0;
    const push = (r: Omit<EconomicDecisionRisk, "heuristicOnly" | "advisoryOnly">) => {
      idx += 1;
      out.push({ ...r, heuristicOnly: true as const, advisoryOnly: true as const });
    };

    const logP = ctx.coordinationBundle.overview.logisticsPressure;
    const opP = ctx.coordinationBundle.overview.operationalPressure;
    if (opP > 0.48 && logP > 0.45) {
      push({
        riskId: `ecmd-risk-mkt-sup-${org.slice(0, 8)}-${idx}`,
        decisionLabel: "Marketing / activation push",
        riskReason:
          "Operational pressure elevated while logistics scalar suggests corridor saturation — acceleration narratives may widen execution gap.",
        impactedPoles: ["marketing_activation", "supply_logistics"],
        systemicExposure: Number(Math.min(1, (opP + logP) / 2).toFixed(4)),
        confidence: Number(Math.min(1, 0.42 + opP * 0.25).toFixed(4)),
        explanation: "Advisory heuristic only — not a prohibition on campaigns.",
        sourceSignals: ["coordination.overview.operationalPressure", "coordination.overview.logisticsPressure"],
      });
    }

    const finP = ctx.coordinationBundle.overview.financialPressure;
    const shockN = ctx.propagationBundle.overview.shockCount ?? 0;
    if (finP > 0.44 && shockN > 4) {
      push({
        riskId: `ecmd-risk-ord-liq-${org.slice(0, 8)}-${idx}`,
        decisionLabel: "Order throughput expansion",
        riskReason: "Liquidity proxy elevated with dense shock field — volume commitments may stress settlement runway.",
        impactedPoles: ["order_adv", "finance_collections"],
        systemicExposure: Number(Math.min(1, finP * 0.65 + Math.min(1, shockN / 14) * 0.35).toFixed(4)),
        confidence: Number(Math.min(1, 0.45 + finP * 0.3).toFixed(4)),
        explanation: "Analytic caution — not a credit block or automatic hold.",
        sourceSignals: ["coordination.overview.financialPressure", "propagation.overview.shockCount"],
      });
    }

    const esc = ctx.coordinationBundle.escalation.escalationLevel;
    const scenRisk = ctx.scenariosBundle.overview.maxProjectedRisk ?? 0;
    if ((esc === "HIGH" || esc === "CRITICAL") && scenRisk > 0.38) {
      push({
        riskId: `ecmd-risk-growth-${org.slice(0, 8)}-${idx}`,
        decisionLabel: "Growth-first sequencing",
        riskReason: "Coordination escalation ladder reads elevated while scenario lattice shows material projected risk.",
        impactedPoles: ["marketing_activation", "finance_collections", "supply_logistics"],
        systemicExposure: Number(Math.min(1, scenRisk * 0.55 + (esc === "CRITICAL" ? 0.35 : 0.22)).toFixed(4)),
        confidence: 0.58,
        explanation: "Executive sequencing advisory — symbolic arbitration only.",
        sourceSignals: ["coordination.escalation.escalationLevel", "scenarios.overview.maxProjectedRisk"],
      });
    }

    out.sort((a, b) => b.systemicExposure - a.systemicExposure || a.riskId.localeCompare(b.riskId));
    return out.slice(0, 12);
  }
}
