import { Injectable } from "@nestjs/common";
import { RelationalSectorMarketStructureType } from "@prisma/client";

import { RelationalSectorPolicyService } from "./relational-sector-policy.service";

export type MarketStructureVector = {
  sectorConcentration: number;
  corridorSaturation: number;
  sectorDominance: number;
  criticalDependency: number;
  oligopolyRisk: number;
  marketFragility: number;
  operationalDensity: number;
  cumulativePressure: number;
  expansionCapacity: number;
  diversificationGap: number;
  explainers: string[];
};

/**
 * Instruction 20.23 — deterministic market-structure vector (bounded, explainable, no ML).
 */
@Injectable()
export class RelationalSectorMarketStructureService {
  constructor(private readonly policy: RelationalSectorPolicyService) {}

  classifyStructure(vector: MarketStructureVector): RelationalSectorMarketStructureType {
    if (vector.oligopolyRisk >= 78 && vector.sectorDominance >= 70) return RelationalSectorMarketStructureType.TIGHT_OLIGOPOLY;
    if (vector.oligopolyRisk >= 55) return RelationalSectorMarketStructureType.MODERATE_OLIGOPOLY;
    if (vector.sectorConcentration <= 35 && vector.diversificationGap <= 40)
      return RelationalSectorMarketStructureType.COMPETITIVE_FRAGMENTED;
    if (vector.criticalDependency >= 72 && vector.sectorDominance >= 60)
      return RelationalSectorMarketStructureType.MONOPSONY_RISK;
    if (vector.marketFragility >= 65) return RelationalSectorMarketStructureType.UNKNOWN;
    return RelationalSectorMarketStructureType.BALANCED;
  }

  computeMarketStructureVector(input: {
    pressureScore: number;
    fragilityScore: number;
    dependencyDensity: number;
    peerCount: number;
    geoZoneAvgPressure: number;
    fulfillmentStress: number;
    sectorPairCount: number;
  }): MarketStructureVector {
    const explainers: string[] = [];
    const sectorConcentration = this.policy.clampInt(
      input.pressureScore * 0.55 + input.geoZoneAvgPressure * 0.35 + input.peerCount * 1.2,
    );
    explainers.push(`sector_concentration:pressure(${input.pressureScore})+geo(${input.geoZoneAvgPressure})`);

    const corridorSaturation = this.policy.clampInt(
      input.dependencyDensity * 0.62 + input.peerCount * 2.4 + input.fulfillmentStress * 0.25,
    );
    explainers.push(`corridor_saturation:depDensity(${input.dependencyDensity})+peers(${input.peerCount})`);

    const sectorDominance = this.policy.clampInt(input.pressureScore * 0.45 + input.fragilityScore * 0.38 + 8);
    explainers.push(`sector_dominance:pressure+fragility blend`);

    const criticalDependency = this.policy.clampInt(
      input.dependencyDensity * 0.5 + input.pressureScore * 0.35 + input.peerCount * 1.8,
    );
    explainers.push(`critical_dependency:graph_stress`);

    const oligopolyRisk = this.policy.clampInt(
      sectorDominance * 0.55 + sectorConcentration * 0.35 + (input.sectorPairCount <= 1 ? 18 : 0),
    );
    explainers.push(`oligopoly_risk:dominance(${sectorDominance})*concentration(${sectorConcentration})`);

    const marketFragility = this.policy.clampInt(
      input.fragilityScore * 0.48 + criticalDependency * 0.32 + corridorSaturation * 0.22,
    );
    explainers.push(`market_fragility:fragility+critical_dep+corridor_sat`);

    const operationalDensity = this.policy.clampInt(
      (sectorConcentration + corridorSaturation + input.fulfillmentStress) / 3,
    );
    explainers.push(`operational_density:mean(concentration,saturation,fulfillment)`);

    const cumulativePressure = this.policy.clampInt(
      (input.pressureScore + input.geoZoneAvgPressure + corridorSaturation) / 3,
    );
    explainers.push(`cumulative_pressure:tri_signal_mean`);

    const expansionCapacity = this.policy.clampInt(
      100 - operationalDensity * 0.55 + (input.peerCount < 4 ? 10 : 0) - oligopolyRisk * 0.15,
    );
    explainers.push(`expansion_capacity:inverse_density_with_peer_guard`);

    const diversificationGap = this.policy.clampInt(
      sectorConcentration - expansionCapacity * 0.35 + criticalDependency * 0.2,
    );
    explainers.push(`diversification_gap:concentration_minus_expansion_read`);

    return {
      sectorConcentration,
      corridorSaturation,
      sectorDominance,
      criticalDependency,
      oligopolyRisk,
      marketFragility,
      operationalDensity,
      cumulativePressure,
      expansionCapacity,
      diversificationGap,
      explainers: explainers.slice(0, 20),
    };
  }
}
