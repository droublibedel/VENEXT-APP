import { BadRequestException } from "@nestjs/common";
import type { RelationalNegotiationConversationState } from "@venext/shared-contracts";

export type ConversationTransitionDiagnostics = {
  transitionValidated: boolean;
  invalidTransitionRejected: boolean;
  transitionSource: "ENGINE" | "HUMAN_CONFIRM" | "HUMAN_REJECT" | "NONE";
};

/**
 * Instruction 20.1B — block clearly unsafe envelope transitions.
 */
export function validateConversationStateTransition(args: {
  from: RelationalNegotiationConversationState;
  to: RelationalNegotiationConversationState;
  source: ConversationTransitionDiagnostics["transitionSource"];
}): ConversationTransitionDiagnostics {
  if (args.from === "DRAFT_CONFIRMED" && args.to === "DRAFT_READY") {
    throw new BadRequestException({
      code: "conversation_invalid_transition",
      from: args.from,
      to: args.to,
    });
  }
  return {
    transitionValidated: true,
    invalidTransitionRejected: false,
    transitionSource: args.source,
  };
}
