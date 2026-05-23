import { Injectable } from "@nestjs/common";

import type { EconomicStabilizationCorridorContext } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";

@Injectable()
export class RelationalEconomicStabilizationRiskService {
  constructor(private readonly policy: RelationalEconomicStabilizationPolicyService) {}

  computeSystemicExposure(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(
      ctx.macroPropagationRisk * 0.25 +
        ctx.dependencyExposureScore * 0.25 +
        ctx.topConflictPressure * 0.2 +
        ctx.topArbitrationScore * 0.15 +
        (100 - ctx.continuityScore) * 0.15,
    );
  }

  detectStrategicInstability(ctx: EconomicStabilizationCorridorContext, instabilityPressure: number): boolean {
    return instabilityPressure >= 58 || ctx.openIncidentCount >= 2 || ctx.topArbitrationUrgency >= 65;
  }

  detectSystemicCollapseRisk(ctx: EconomicStabilizationCorridorContext, systemicExposure: number): boolean {
    return systemicExposure >= 72 || ctx.macroStructuralFragility >= 70 || ctx.strategicCaptivityRisk >= 75;
  }
}
