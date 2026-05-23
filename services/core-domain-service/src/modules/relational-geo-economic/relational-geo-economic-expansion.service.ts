import { Injectable } from "@nestjs/common";

import { RelationalGeoEconomicPolicyService } from "./relational-geo-economic-policy.service";

/**
 * Instruction 20.22 — expansion projection (read-only heuristics, no automated commerce).
 */
@Injectable()
export class RelationalGeoEconomicExpansionService {
  constructor(private readonly policy: RelationalGeoEconomicPolicyService) {}

  computeExpansionPotential(input: {
    corridorCount: number;
    corridorWeightAvg: number;
    operationalDensityScore: number;
    economicPressureScore: number;
    peerCorridorCount: number;
  }): { expansionPotentialScore: number; dependencyStress: boolean; underusedCorridorSignal: boolean } {
    const underusedCorridorSignal = input.corridorWeightAvg < 0.35 && input.corridorCount <= 6;
    const dependencyStress = input.peerCorridorCount >= 14;
    const lowDensityGrowth = input.operationalDensityScore < 48 && input.economicPressureScore >= 52;
    const expansionPotentialScore = this.policy.clampInt(
      100 -
        input.operationalDensityScore * 0.55 +
        (underusedCorridorSignal ? 18 : 0) +
        (lowDensityGrowth ? 12 : 0) -
        (dependencyStress ? 22 : 0),
    );
    return { expansionPotentialScore, dependencyStress, underusedCorridorSignal };
  }
}
