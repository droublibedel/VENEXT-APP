import { Injectable } from "@nestjs/common";
import { CommercialCorridorState } from "@prisma/client";

@Injectable()
export class RelationalEconomicContinuityPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  clampProb(n: number): number {
    if (!Number.isFinite(n)) return 0.05;
    return Math.max(0.05, Math.min(0.95, Math.round(n * 1000) / 1000));
  }

  canMutateContinuityState(corridorState: CommercialCorridorState): boolean {
    return (
      corridorState !== CommercialCorridorState.TERMINATED &&
      corridorState !== CommercialCorridorState.BLOCKED &&
      corridorState !== CommercialCorridorState.SUSPENDED
    );
  }

  assertEconomicContinuityMutationAllowed(corridorState: CommercialCorridorState): {
    allowed: boolean;
    diagnostics: {
      governanceOperation: "economic_continuity_ingestion";
      mutationBlocked: boolean;
      continuityMutationRejected: boolean;
      corridorTerminated: boolean;
      mutationSkippedReason: string | null;
    };
  } {
    const allowed = this.canMutateContinuityState(corridorState);
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
        governanceOperation: "economic_continuity_ingestion",
        mutationBlocked: !allowed,
        continuityMutationRejected: !allowed,
        corridorTerminated: corridorState === CommercialCorridorState.TERMINATED,
        mutationSkippedReason,
      },
    };
  }

  maxRecoveryDepth(): number {
    const raw = Number.parseInt(process.env.VENEXT_CONTINUITY_MAX_DEPTH ?? "8", 10);
    if (!Number.isFinite(raw) || raw < 1) return 8;
    return Math.min(32, Math.max(1, raw));
  }
}
