import { Injectable } from "@nestjs/common";
import { CommercialCorridorState } from "@prisma/client";

export const VENEXT_EXECUTIVE_ORCHESTRATION_MAX_DEPTH = 6;

@Injectable()
export class RelationalExecutiveOrchestrationPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  canMutateExecutiveOrchestrationState(corridorState: CommercialCorridorState): boolean {
    return (
      corridorState !== CommercialCorridorState.TERMINATED &&
      corridorState !== CommercialCorridorState.BLOCKED &&
      corridorState !== CommercialCorridorState.SUSPENDED
    );
  }

  assertExecutiveOrchestrationMutationAllowed(corridorState: CommercialCorridorState): {
    allowed: boolean;
    diagnostics: {
      governanceOperation: "executive_orchestration_ingestion";
      mutationBlocked: boolean;
      executiveOrchestrationMutationRejected: boolean;
      corridorTerminated: boolean;
      mutationSkippedReason: string | null;
    };
  } {
    const allowed = this.canMutateExecutiveOrchestrationState(corridorState);
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
        governanceOperation: "executive_orchestration_ingestion",
        mutationBlocked: !allowed,
        executiveOrchestrationMutationRejected: !allowed,
        corridorTerminated: corridorState === CommercialCorridorState.TERMINATED,
        mutationSkippedReason,
      },
    };
  }
}
