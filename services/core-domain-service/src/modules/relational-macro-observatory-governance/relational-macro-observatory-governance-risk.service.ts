import { Injectable } from "@nestjs/common";

import type { MacroObservatoryGovernanceCorridorContext } from "./relational-macro-observatory-governance-corridor-context.service";
import { RelationalMacroObservatoryGovernancePolicyService } from "./relational-macro-observatory-governance-policy.service";

@Injectable()
export class RelationalMacroObservatoryGovernanceRiskService {
  constructor(private readonly policy: RelationalMacroObservatoryGovernancePolicyService) {}

  computeExecutiveCoordinationPressure(ctx: MacroObservatoryGovernanceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicObservatoryExecutiveExposure * 0.35 +
        ctx.topStrategicObservatoryScore * 0.25 +
        ctx.topOperationsExecutivePressure * 0.2 +
        ctx.governanceConflictCount * 6,
    );
  }

  computeSystemicConcentration(ctx: MacroObservatoryGovernanceCorridorContext): number {
    return this.policy.clampInt(
      ctx.topStrategicExecutiveConcentration * 0.3 +
        ctx.topStrategicObservatorySystemicPressure * 0.35 +
        ctx.peerRelationshipCount * 7 +
        ctx.macroPropagationRisk * 0.2,
    );
  }
}
