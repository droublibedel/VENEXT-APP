import { Injectable } from "@nestjs/common";
import { CommercialCorridorState } from "@prisma/client";

/**
 * Instruction 20.24 — deterministic bounds for supply-flow intelligence (no logistics ERP semantics).
 */
@Injectable()
export class RelationalSupplyFlowPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  canMutateSupplyFlowState(corridorState: CommercialCorridorState): boolean {
    return corridorState !== CommercialCorridorState.TERMINATED;
  }

  /**
   * Instruction 20.24A — single governance gate for any supply-flow Prisma mutation (ingestion, archive already guarded separately).
   */
  assertSupplyFlowMutationAllowed(corridorState: CommercialCorridorState): {
    allowed: boolean;
    diagnostics: {
      governanceOperation: "supply_flow_ingestion";
      mutationBlocked: boolean;
      corridorTerminated: boolean;
    };
  } {
    const allowed = this.canMutateSupplyFlowState(corridorState);
    return {
      allowed,
      diagnostics: {
        governanceOperation: "supply_flow_ingestion",
        mutationBlocked: !allowed,
        corridorTerminated: corridorState === CommercialCorridorState.TERMINATED,
      },
    };
  }

  maxPropagationDepth(): number {
    const raw = Number.parseInt(process.env.VENEXT_SUPPLY_FLOW_MAX_DEPTH ?? "8", 10);
    if (!Number.isFinite(raw) || raw < 1) return 8;
    return Math.min(32, Math.max(1, raw));
  }

  slugify(s: string): string {
    return s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80)
      .toUpperCase() || "UNLABELED";
  }
}
