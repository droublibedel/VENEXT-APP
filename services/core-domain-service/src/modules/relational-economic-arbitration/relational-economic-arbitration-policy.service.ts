import { Injectable } from "@nestjs/common";
import { CommercialCorridorState, RelationalEconomicArbitrationScenarioType } from "@prisma/client";

export const DUAL_VALIDATION_SCENARIO_TYPES: RelationalEconomicArbitrationScenarioType[] = [
  RelationalEconomicArbitrationScenarioType.SYSTEMIC_CONTAINMENT,
  RelationalEconomicArbitrationScenarioType.TERRITORIAL_REBALANCING,
  RelationalEconomicArbitrationScenarioType.SECTOR_REBALANCING,
];

@Injectable()
export class RelationalEconomicArbitrationPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  clampProb(n: number): number {
    if (!Number.isFinite(n)) return 0.05;
    return Math.max(0.05, Math.min(0.95, Math.round(n * 1000) / 1000));
  }

  requiresDualValidation(scenarioType: RelationalEconomicArbitrationScenarioType): boolean {
    return DUAL_VALIDATION_SCENARIO_TYPES.includes(scenarioType);
  }

  canMutateArbitrationState(corridorState: CommercialCorridorState): boolean {
    return (
      corridorState !== CommercialCorridorState.TERMINATED &&
      corridorState !== CommercialCorridorState.BLOCKED &&
      corridorState !== CommercialCorridorState.SUSPENDED
    );
  }

  assertEconomicArbitrationMutationAllowed(corridorState: CommercialCorridorState): {
    allowed: boolean;
    diagnostics: {
      governanceOperation: "economic_arbitration_ingestion";
      mutationBlocked: boolean;
      arbitrationMutationRejected: boolean;
      corridorTerminated: boolean;
      mutationSkippedReason: string | null;
    };
  } {
    const allowed = this.canMutateArbitrationState(corridorState);
    let mutationSkippedReason: string | null = null;
    if (corridorState === CommercialCorridorState.TERMINATED) {
      mutationSkippedReason = "corridor_terminated";
    } else if (corridorState === CommercialCorridorState.SUSPENDED) {
      mutationSkippedReason = "corridor_suspended";
    } else if (corridorState === CommercialCorridorState.BLOCKED) {
      mutationSkippedReason = "corridor_blocked";
    }
    return {
      allowed,
      diagnostics: {
        governanceOperation: "economic_arbitration_ingestion",
        mutationBlocked: !allowed,
        arbitrationMutationRejected: !allowed,
        corridorTerminated: corridorState === CommercialCorridorState.TERMINATED,
        mutationSkippedReason,
      },
    };
  }
}
