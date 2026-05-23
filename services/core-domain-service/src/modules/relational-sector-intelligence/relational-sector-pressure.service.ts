import { Injectable } from "@nestjs/common";
import { RelationalSectorConcentrationLevel, RelationalSectorPressureLevel } from "@prisma/client";

import { RelationalSectorPolicyService } from "./relational-sector-policy.service";

@Injectable()
export class RelationalSectorPressureService {
  constructor(private readonly policy: RelationalSectorPolicyService) {}

  riskScoreToPressureLevel(score: number): RelationalSectorPressureLevel {
    if (score >= 85) return RelationalSectorPressureLevel.CRITICAL;
    if (score >= 65) return RelationalSectorPressureLevel.HIGH;
    if (score >= 40) return RelationalSectorPressureLevel.MEDIUM;
    return RelationalSectorPressureLevel.LOW;
  }

  concentrationFromVector(concentrationScore: number): RelationalSectorConcentrationLevel {
    if (concentrationScore >= 78) return RelationalSectorConcentrationLevel.DOMINANT;
    if (concentrationScore >= 55) return RelationalSectorConcentrationLevel.CONCENTRATED;
    if (concentrationScore >= 32) return RelationalSectorConcentrationLevel.MODERATE;
    return RelationalSectorConcentrationLevel.DISPERSED;
  }

  blendOperationalRisk(input: {
    pressureScore: number;
    fragilityScore: number;
    vectorCumulativePressure: number;
  }): number {
    return this.policy.clampInt(
      input.pressureScore * 0.38 + input.fragilityScore * 0.32 + input.vectorCumulativePressure * 0.32,
    );
  }
}
