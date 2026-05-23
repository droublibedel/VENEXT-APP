import { Injectable } from "@nestjs/common";

import { RelationalGeoEconomicPolicyService } from "./relational-geo-economic-policy.service";

export type ZoneDensityVector = {
  corridorDensity: number;
  fulfillmentDensity: number;
  orchestrationDensity: number;
  operationalDensity: number;
  clusterDensity: number;
  pressureDensity: number;
  operationalDensityScore: number;
};

/**
 * Instruction 20.22 — bounded, explainable, deterministic density components.
 */
@Injectable()
export class RelationalGeoEconomicDensityService {
  constructor(private readonly policy: RelationalGeoEconomicPolicyService) {}

  computeZoneDensity(input: {
    corridorCount: number;
    clusterCount: number;
    pressureScore: number;
    dependencyDensity: number;
    fragilityScore: number;
    propagationExposureScore: number;
  }): ZoneDensityVector {
    const corridorDensity = this.policy.clampInt(input.corridorCount * 7 + input.clusterCount * 2);
    const fulfillmentDensity = this.policy.clampInt(
      input.pressureScore * 0.45 + input.fragilityScore * 0.28 + input.dependencyDensity * 0.12,
    );
    const orchestrationDensity = this.policy.clampInt(input.dependencyDensity * 0.88 + 6);
    const clusterDensity = this.policy.clampInt(input.clusterCount * 9 + 4);
    const pressureDensity = this.policy.clampInt(
      input.pressureScore * 0.82 + input.propagationExposureScore * 0.22,
    );
    const operationalDensity = this.policy.clampInt(
      (corridorDensity + fulfillmentDensity + orchestrationDensity + clusterDensity + pressureDensity) / 5,
    );
    const operationalDensityScore = this.policy.clampInt(
      (corridorDensity + operationalDensity + pressureDensity) / 3,
    );
    return {
      corridorDensity,
      fulfillmentDensity,
      orchestrationDensity,
      operationalDensity,
      clusterDensity,
      pressureDensity,
      operationalDensityScore,
    };
  }
}
