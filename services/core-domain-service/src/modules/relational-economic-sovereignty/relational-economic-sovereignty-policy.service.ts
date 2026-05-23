import { Injectable } from "@nestjs/common";
import { CommercialCorridorState } from "@prisma/client";

@Injectable()
export class RelationalEconomicSovereigntyPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  clampProb(n: number): number {
    if (!Number.isFinite(n)) return 0.05;
    return Math.max(0.05, Math.min(0.95, Math.round(n * 1000) / 1000));
  }

  canMutateSovereigntyState(corridorState: CommercialCorridorState): boolean {
    return (
      corridorState !== CommercialCorridorState.TERMINATED &&
      corridorState !== CommercialCorridorState.BLOCKED &&
      corridorState !== CommercialCorridorState.SUSPENDED
    );
  }

  assertEconomicSovereigntyMutationAllowed(corridorState: CommercialCorridorState): {
    allowed: boolean;
    diagnostics: {
      governanceOperation: "economic_sovereignty_ingestion";
      mutationBlocked: boolean;
      sovereigntyMutationRejected: boolean;
      corridorTerminated: boolean;
      mutationSkippedReason: string | null;
    };
  } {
    const allowed = this.canMutateSovereigntyState(corridorState);
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
        governanceOperation: "economic_sovereignty_ingestion",
        mutationBlocked: !allowed,
        sovereigntyMutationRejected: !allowed,
        corridorTerminated: corridorState === CommercialCorridorState.TERMINATED,
        mutationSkippedReason,
      },
    };
  }

  maxSovereigntyDepth(): number {
    const raw = Number.parseInt(process.env.VENEXT_SOVEREIGNTY_MAX_DEPTH ?? "8", 10);
    if (!Number.isFinite(raw) || raw < 1) return 8;
    return Math.min(32, Math.max(1, raw));
  }

  maxSnapshotsPerCorridor(): number {
    const raw = Number.parseInt(process.env.VENEXT_SOVEREIGNTY_MAX_SNAPSHOTS_PER_CORRIDOR ?? "24", 10);
    if (!Number.isFinite(raw) || raw < 4) return 24;
    return Math.min(256, Math.max(4, raw));
  }

  retentionDays(): number {
    const raw = Number.parseInt(process.env.VENEXT_SOVEREIGNTY_RETENTION_DAYS ?? "90", 10);
    if (!Number.isFinite(raw) || raw < 7) return 90;
    return Math.min(730, Math.max(7, raw));
  }

  preserveCriticalSnapshots(): boolean {
    const raw = (process.env.VENEXT_SOVEREIGNTY_PRESERVE_CRITICAL ?? "true").toLowerCase();
    return raw !== "false" && raw !== "0";
  }

  retentionPolicyLabel(): string {
    return `max=${this.maxSnapshotsPerCorridor()};days=${this.retentionDays()};preserveCritical=${this.preserveCriticalSnapshots()}`;
  }

  edgeScanLimit(): number {
    const raw = Number.parseInt(process.env.VENEXT_SOVEREIGNTY_EDGE_SCAN_LIMIT ?? "48", 10);
    if (!Number.isFinite(raw) || raw < 4) return 48;
    return Math.min(256, Math.max(4, raw));
  }

  edgeMaxDepth(): number {
    const raw = Number.parseInt(process.env.VENEXT_SOVEREIGNTY_EDGE_MAX_DEPTH ?? "4", 10);
    if (!Number.isFinite(raw) || raw < 1) return 4;
    return Math.min(16, Math.max(1, raw));
  }
}
