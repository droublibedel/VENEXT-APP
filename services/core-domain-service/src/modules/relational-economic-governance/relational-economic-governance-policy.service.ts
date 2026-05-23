import { Injectable } from "@nestjs/common";
import { CommercialCorridorState } from "@prisma/client";

@Injectable()
export class RelationalEconomicGovernancePolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  maxGovernanceDepth(): number {
    const raw = Number.parseInt(process.env.VENEXT_GOVERNANCE_MAX_DEPTH ?? "8", 10);
    if (!Number.isFinite(raw) || raw < 1) return 8;
    return Math.min(32, Math.max(1, raw));
  }

  canMutateGovernanceState(corridorState: CommercialCorridorState): boolean {
    return (
      corridorState !== CommercialCorridorState.TERMINATED &&
      corridorState !== CommercialCorridorState.BLOCKED &&
      corridorState !== CommercialCorridorState.SUSPENDED
    );
  }

  assertEconomicGovernanceMutationAllowed(corridorState: CommercialCorridorState): {
    allowed: boolean;
    diagnostics: {
      governanceOperation: "economic_governance_ingestion";
      mutationBlocked: boolean;
      governanceMutationRejected: boolean;
      corridorTerminated: boolean;
      mutationSkippedReason: string | null;
    };
  } {
    const allowed = this.canMutateGovernanceState(corridorState);
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
        governanceOperation: "economic_governance_ingestion",
        mutationBlocked: !allowed,
        governanceMutationRejected: !allowed,
        corridorTerminated: corridorState === CommercialCorridorState.TERMINATED,
        mutationSkippedReason,
      },
    };
  }
}
