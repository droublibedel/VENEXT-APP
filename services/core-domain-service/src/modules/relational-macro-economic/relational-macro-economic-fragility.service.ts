import { Injectable } from "@nestjs/common";
import type { RelationalMacroEconomicNode } from "@prisma/client";

import { RelationalMacroEconomicPolicyService } from "./relational-macro-economic-policy.service";

@Injectable()
export class RelationalMacroEconomicFragilityService {
  constructor(private readonly policy: RelationalMacroEconomicPolicyService) {}

  buildFragilityMaps(nodes: RelationalMacroEconomicNode[]): {
    fragilityByTerritory: Record<string, number>;
    fragilityBySector: Record<string, number>;
    fragileZones: { macroNodeId: string; macroNodeCode: string; score: number }[];
  } {
    const fragilityByTerritory: Record<string, number> = {};
    const fragilityBySector: Record<string, number> = {};
    const fragileZones: { macroNodeId: string; macroNodeCode: string; score: number }[] = [];

    for (const n of nodes.filter((x) => x.active)) {
      const tKey = `${n.territoryCountry}|${n.territoryCity}`;
      fragilityByTerritory[tKey] = this.policy.clampInt(
        (fragilityByTerritory[tKey] ?? 0) * 0.5 + n.fragilityScore * 0.5,
      );
      const sector = n.sectorSlug ?? "UNKNOWN";
      fragilityBySector[sector] = this.policy.clampInt(
        (fragilityBySector[sector] ?? 0) * 0.5 + n.fragilityScore * 0.5,
      );
      if (n.fragilityScore >= 52) {
        fragileZones.push({
          macroNodeId: n.id,
          macroNodeCode: n.macroNodeCode,
          score: n.fragilityScore,
        });
      }
    }

    return {
      fragilityByTerritory,
      fragilityBySector,
      fragileZones: fragileZones.sort((a, b) => b.score - a.score).slice(0, 12),
    };
  }
}
