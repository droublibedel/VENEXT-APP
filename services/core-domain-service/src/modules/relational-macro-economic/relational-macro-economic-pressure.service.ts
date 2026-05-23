import { Injectable } from "@nestjs/common";
import type { RelationalMacroEconomicNode } from "@prisma/client";

import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";

@Injectable()
export class RelationalMacroEconomicPressureService {
  constructor(private readonly policy: RelationalMacroEconomicPolicyService) {}

  aggregateSystemicPressure(nodes: RelationalMacroEconomicNode[]): number {
    const active = nodes.filter((n) => n.active);
    if (active.length === 0) return 0;
    return this.policy.clampInt(active.reduce((s, n) => s + n.systemicPressure, 0) / active.length);
  }

  listCriticalCorridors(nodes: RelationalMacroEconomicNode[]) {
    return nodes
      .filter((n) => n.active && n.macroEconomicRisk >= 58)
      .map((n) => ({
        macroNodeId: n.id,
        macroNodeCode: n.macroNodeCode,
        score: n.macroEconomicRisk,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }
}
