/**
 * Instruction 20.21 — structural fragility zones from dependency concentration.
 */
import { Injectable } from "@nestjs/common";

import { RelationalEconomicPressurePolicyService } from "./relational-economic-pressure-policy.service";

export type NodeFragilityInput = {
  relationshipId: string;
  fragilityScore: number;
  dependencyDensity: number;
  systemicWeight: number;
  peerCount: number;
};

@Injectable()
export class RelationalEconomicFragilityService {
  constructor(private readonly policy: RelationalEconomicPressurePolicyService) {}

  detectFragilityZones(nodes: NodeFragilityInput[]): Array<{
    zoneCode: string;
    corridorCount: number;
    fragilityScore: number;
    narrative: string;
  }> {
    if (!nodes.length) return [];
    const high = nodes.filter((n) => n.fragilityScore >= 55 || n.dependencyDensity >= 50);
    const concentration = nodes.filter((n) => n.peerCount >= 4 && n.systemicWeight >= 55);
    const zones: Array<{ zoneCode: string; corridorCount: number; fragilityScore: number; narrative: string }> = [];
    if (high.length) {
      zones.push({
        zoneCode: "CORRIDOR_FRAGILITY_BAND",
        corridorCount: high.length,
        fragilityScore: this.policy.clampInt(
          high.reduce((s, n) => s + n.fragilityScore, 0) / high.length,
        ),
        narrative: "Concentration de fragilité opérationnelle corridor — dépendances actives et signaux ouverts.",
      });
    }
    if (concentration.length) {
      zones.push({
        zoneCode: "MULTI_PEER_SATURATION",
        corridorCount: concentration.length,
        fragilityScore: this.policy.clampInt(
          concentration.reduce((s, n) => s + n.systemicWeight, 0) / concentration.length,
        ),
        narrative: "Saturation multi-corridors liés aux mêmes acteurs économiques — risque de contagion structurelle borné.",
      });
    }
    return zones.slice(0, 12);
  }

  detectExcessiveDependencyConcentration(nodes: NodeFragilityInput[]): boolean {
    return nodes.some((n) => n.peerCount >= 6 && n.dependencyDensity >= 60);
  }
}
