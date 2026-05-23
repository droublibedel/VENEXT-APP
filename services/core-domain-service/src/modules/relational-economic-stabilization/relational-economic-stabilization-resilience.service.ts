import { Injectable } from "@nestjs/common";

import type { EconomicStabilizationCorridorContext } from "./relational-economic-stabilization-corridor-context.service";
import { RelationalEconomicStabilizationEngineService } from "./relational-economic-stabilization-engine.service";
import { RelationalEconomicStabilizationPolicyService } from "./relational-economic-stabilization-policy.service";

export type ResilienceProjection = {
  resiliencePotential: number;
  recoveryStrength: number;
  strategicDurability: number;
  systemicRecoveryProbability: number;
};

@Injectable()
export class RelationalEconomicStabilizationResilienceService {
  constructor(
    private readonly policy: RelationalEconomicStabilizationPolicyService,
    private readonly engine: RelationalEconomicStabilizationEngineService,
  ) {}

  computeResiliencePotential(ctx: EconomicStabilizationCorridorContext): number {
    const state = this.engine.computeStabilizationState(ctx);
    return state.resilienceLevel;
  }

  computeRecoveryStrength(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(
      ctx.activeRecoveryScore * 0.55 + this.engine.computeRecoveryPotential(ctx) * 0.45,
    );
  }

  computeStrategicDurability(ctx: EconomicStabilizationCorridorContext): number {
    return this.policy.clampInt(
      ctx.autonomyScore * 0.35 + ctx.activeGovernanceStability * 0.35 + (100 - ctx.strategicCaptivityRisk) * 0.3,
    );
  }

  computeSystemicRecoveryProbability(ctx: EconomicStabilizationCorridorContext): number {
    const exposure = this.engine.computeSystemicExposure(ctx);
    const recovery = this.engine.computeRecoveryPotential(ctx);
    return this.policy.clampInt(recovery * 0.6 + (100 - exposure) * 0.4);
  }

  projectResilience(ctx: EconomicStabilizationCorridorContext): ResilienceProjection {
    return {
      resiliencePotential: this.computeResiliencePotential(ctx),
      recoveryStrength: this.computeRecoveryStrength(ctx),
      strategicDurability: this.computeStrategicDurability(ctx),
      systemicRecoveryProbability: this.computeSystemicRecoveryProbability(ctx),
    };
  }
}
