import { Injectable } from "@nestjs/common";
import { CommercialCorridorState } from "@prisma/client";

export const VENEXT_STABILIZATION_MAX_DEPTH = 6;

@Injectable()
export class RelationalEconomicStabilizationPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  canMutateStabilizationState(corridorState: CommercialCorridorState): boolean {
    return (
      corridorState !== CommercialCorridorState.TERMINATED &&
      corridorState !== CommercialCorridorState.BLOCKED &&
      corridorState !== CommercialCorridorState.SUSPENDED
    );
  }

  assertEconomicStabilizationMutationAllowed(corridorState: CommercialCorridorState): {
    allowed: boolean;
    diagnostics: {
      governanceOperation: "economic_stabilization_ingestion";
      mutationBlocked: boolean;
      stabilizationMutationRejected: boolean;
      corridorTerminated: boolean;
      mutationSkippedReason: string | null;
    };
  } {
    const allowed = this.canMutateStabilizationState(corridorState);
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
        governanceOperation: "economic_stabilization_ingestion",
        mutationBlocked: !allowed,
        stabilizationMutationRejected: !allowed,
        corridorTerminated: corridorState === CommercialCorridorState.TERMINATED,
        mutationSkippedReason,
      },
    };
  }
}
