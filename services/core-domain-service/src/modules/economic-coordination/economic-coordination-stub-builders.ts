import type {
  CoordinationConflict,
  EconomicCoordinationMemoryBlock,
  EconomicEscalation,
  ResponseOrchestration,
} from "@venext/shared-contracts";

/** Shared placeholders so bundle compose and HTTP slice routes stay aligned (Instruction 18.4A). */
export function buildDisabledEscalationSlice(): EconomicEscalation {
  return {
    escalationLevel: "LOW",
    escalationScore: 0,
    escalationDrivers: ["economic_escalation_disabled"],
    affectedPoles: [],
    coordinationRecommendation:
      "Escalation slice gated — enable economic_escalation_enabled for ladder readout.",
    executiveAttentionRequired: false,
    diagnostics: ["flag:economic_escalation_enabled=false"],
  };
}

export function buildDisabledMemorySlice(): EconomicCoordinationMemoryBlock {
  return {
    recurringPatterns: [],
    recurringConflicts: [],
    recurringStabilizationPatterns: [],
    memoryConfidence: 0,
    historicalSimilarity: 0,
    signals: [],
    diagnostics: ["flag:coordination_memory_enabled=false"],
  };
}

export function buildDisabledConflictsSlice(): CoordinationConflict[] {
  return [];
}

export function buildDisabledOrchestrationSlice(): ResponseOrchestration[] {
  return [];
}
