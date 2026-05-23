import { Injectable } from "@nestjs/common";
import type { EconomicArbitration } from "@venext/shared-contracts";

import type { EconomicCommandComposeContext } from "./economic-command.types";

@Injectable()
export class EconomicArbitrationService {
  build(ctx: EconomicCommandComposeContext): EconomicArbitration[] {
    const org = ctx.organizationId;
    const out: EconomicArbitration[] = [];
    let idx = 0;
    const push = (a: Omit<EconomicArbitration, "nonOperationalExecution">) => {
      idx += 1;
      out.push({ ...a, nonOperationalExecution: true as const });
    };

    const fin = ctx.coordinationBundle.overview.financialPressure;
    const log = ctx.coordinationBundle.overview.logisticsPressure;
    if (fin > 0.35 && log > 0.38) {
      const tensionScore = Number(Math.min(1, (fin + log) / 2).toFixed(4));
      push({
        arbitrationId: `ecmd-arb-sf-${org.slice(0, 8)}-${idx}`,
        arbitrationType: "supply_vs_finance",
        involvedPoles: ["supply_logistics", "finance_collections"],
        tensionScore,
        recommendedDirection: "Sequence liquidity guardrails before parallel distribution acceleration proposals.",
        tradeoffExplanation:
          "Finance proxy and logistics scalar diverge — document explicit runway trade-offs in steering (heuristic).",
        executiveAttentionRequired: tensionScore > 0.55,
        sourceSignals: ["coordination.overview.financialPressure", "coordination.overview.logisticsPressure"],
      });
    }

    const mkt = ctx.coordinationBundle.overview.operationalPressure;
    if (mkt > 0.5 && log > 0.42) {
      push({
        arbitrationId: `ecmd-arb-ml-${org.slice(0, 8)}-${idx}`,
        arbitrationType: "marketing_vs_logistics",
        involvedPoles: ["marketing_activation", "supply_logistics"],
        tensionScore: Number(Math.min(1, mkt * 0.52 + log * 0.48).toFixed(4)),
        recommendedDirection: "Cap symbolic activation density until congestion scalar relaxes.",
        tradeoffExplanation: "Activation narratives vs corridor feasibility — arbitration is read-only.",
        executiveAttentionRequired: false,
        sourceSignals: ["coordination.overview.operationalPressure", "coordination.overview.logisticsPressure"],
      });
    }

    const rel = ctx.propagationBundle.territoryFragility.reduce((m, t) => Math.max(m, t.relationshipExposure), 0);
    const growth = ctx.scenariosBundle.overview.maxProjectedRisk ?? 0;
    if (rel > 0.35 && growth > 0.45) {
      push({
        arbitrationId: `ecmd-arb-ce-${org.slice(0, 8)}-${idx}`,
        arbitrationType: "commercial_expansion_vs_relationship_trust",
        involvedPoles: ["commercial_network", "marketing_activation"],
        tensionScore: Number(Math.min(1, rel * 0.5 + growth * 0.5).toFixed(4)),
        recommendedDirection: "Prefer relationship arbitration thread before expansion pushes in planning narratives.",
        tradeoffExplanation: "Trust-field exposure vs growth scenario risk — non-executing advisory.",
        executiveAttentionRequired: rel > 0.5,
        sourceSignals: ["propagation.territoryFragility.relationshipExposure", "scenarios.overview.maxProjectedRisk"],
      });
    }

    out.sort((a, b) => b.tensionScore - a.tensionScore || a.arbitrationId.localeCompare(b.arbitrationId));
    return out.slice(0, 10);
  }
}
