import { CommercialCorridorState } from "@prisma/client";

/** Instruction 20.4A — persisted corridor states the health engine must not overwrite. */
export const PROTECTED_CORRIDOR_STATES = new Set<CommercialCorridorState>([
  CommercialCorridorState.BLOCKED,
  CommercialCorridorState.SUSPENDED,
  CommercialCorridorState.RESTRICTED,
  CommercialCorridorState.TERMINATED,
  CommercialCorridorState.PENDING_REVIEW,
]);

/** API visibility scopes (Instruction 20.4 — redaction layers). */
export type RelationshipIntelligenceScope =
  | "RELATIONSHIP_SELF_PRIVATE"
  | "RELATIONSHIP_PARTNER_LIMITED"
  | "RELATIONSHIP_BACKOFFICE_FULL"
  | "RELATIONSHIP_NONE";

export type CorridorGovernanceDiagnostics = {
  governanceValidated: boolean;
  transitionAllowed: boolean;
  governanceReason: string;
  governanceDecisionSource:
    | "HEURISTIC_ENGINE"
    | "GRAPH_STATUS_SYNC"
    | "SPONSORED_SYNC"
    | "BACKOFFICE_OVERRIDE"
    | "HEALTH_COMPUTE";
  humanModerationRequired: boolean;
  sponsoredOrigin: boolean;
  sponsoredConversionSuccess: boolean | null;
  sponsoredCommercialConsistency: boolean | null;
};

export type CorridorRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CorridorHealthBand = "LOW" | "MEDIUM" | "HIGH";

export function healthScoreToBand(score: number): CorridorHealthBand {
  if (score < 38) return "LOW";
  if (score < 68) return "MEDIUM";
  return "HIGH";
}

/**
 * Instruction 20.4A — single risk derivation (no LOW/HIGH inversion vs health band).
 */
export function deriveCorridorRiskLevel(input: {
  healthScore: number;
  corridorState: CommercialCorridorState;
  degraded?: boolean;
}): CorridorRiskLevel {
  const { corridorState: cs, healthScore: h, degraded } = input;
  if (cs === CommercialCorridorState.TERMINATED || cs === CommercialCorridorState.BLOCKED) return "CRITICAL";
  if (cs === CommercialCorridorState.SUSPENDED || cs === CommercialCorridorState.RESTRICTED) return "HIGH";
  if (cs === CommercialCorridorState.DEGRADED || degraded) return h < 42 ? "HIGH" : "MEDIUM";
  if (cs === CommercialCorridorState.DORMANT) return "MEDIUM";
  if (cs === CommercialCorridorState.PENDING_REVIEW || cs === CommercialCorridorState.INVITED) return "MEDIUM";
  if (h >= 68 && cs === CommercialCorridorState.ACTIVE) return "LOW";
  if (h >= 38) return "MEDIUM";
  return "HIGH";
}

export type CorridorTransitionMatrix = Record<CommercialCorridorState, readonly CommercialCorridorState[]>;
