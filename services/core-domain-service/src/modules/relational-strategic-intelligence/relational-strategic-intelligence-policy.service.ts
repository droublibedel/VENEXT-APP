import { Injectable } from "@nestjs/common";
import { CommercialCorridorState } from "@prisma/client";

export const VENEXT_STRATEGIC_INTELLIGENCE_MAX_DEPTH = 6;

@Injectable()
export class RelationalStrategicIntelligencePolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  canMutateStrategicIntelligenceState(corridorState: CommercialCorridorState): boolean {
    return (
      corridorState !== CommercialCorridorState.TERMINATED &&
      corridorState !== CommercialCorridorState.BLOCKED &&
      corridorState !== CommercialCorridorState.SUSPENDED
    );
  }

  assertStrategicIntelligenceMutationAllowed(corridorState: CommercialCorridorState): {
    allowed: boolean;
    diagnostics: {
      governanceOperation: "strategic_intelligence_ingestion";
      mutationBlocked: boolean;
      strategicIntelligenceMutationRejected: boolean;
      corridorTerminated: boolean;
      mutationSkippedReason: string | null;
    };
  } {
    const allowed = this.canMutateStrategicIntelligenceState(corridorState);
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
        governanceOperation: "strategic_intelligence_ingestion",
        mutationBlocked: !allowed,
        strategicIntelligenceMutationRejected: !allowed,
        corridorTerminated: corridorState === CommercialCorridorState.TERMINATED,
        mutationSkippedReason,
      },
    };
  }
}
