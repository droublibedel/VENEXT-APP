import { Injectable } from "@nestjs/common";

import type { SovereigntyAutonomyScores } from "./relational-economic-sovereignty-autonomy.service";
import type { SovereigntyRecoveryDiagnostics } from "./relational-economic-sovereignty-recovery.service";
import { RelationalEconomicSovereigntyCalibrationService } from "./relational-economic-sovereignty-calibration.service";
import { RelationalEconomicSovereigntyPolicyService } from "./relational-economic-sovereignty-policy.service";

@Injectable()
export class RelationalEconomicSovereigntyResilienceService {
  constructor(
    private readonly policy: RelationalEconomicSovereigntyPolicyService,
    private readonly calibration: RelationalEconomicSovereigntyCalibrationService,
  ) {}

  projectResilienceAutonomy(
    autonomy: SovereigntyAutonomyScores,
    traversal: SovereigntyRecoveryDiagnostics,
  ): {
    resilienceAutonomyProjection: number;
    autonomyRecoveryPressure: number;
    dependencyRecoveryComplexity: number;
  } {
    const rw = this.calibration.getCalibration().resilienceWeights;
    const resilienceAutonomyProjection = this.policy.clampInt(
      autonomy.resilienceAutonomy * rw.projectionFromResilience +
        (100 - traversal.autonomyExposure) * rw.exposureMitigation -
        traversal.traversalDepth * rw.depthPenalty,
    );
    const autonomyRecoveryPressure = this.policy.clampInt(
      autonomy.strategicCaptivityRisk * rw.pressureFromCaptivity +
        traversal.autonomyExposure * rw.pressureFromExposure +
        (100 - autonomy.autonomyScore) * rw.pressureFromLowAutonomy,
    );
    const dependencyRecoveryComplexity = this.policy.clampInt(
      traversal.recoveryComplexity * rw.complexityFromTraversal +
        autonomy.dependencyCriticality * rw.complexityFromCriticality,
    );
    return { resilienceAutonomyProjection, autonomyRecoveryPressure, dependencyRecoveryComplexity };
  }
}
