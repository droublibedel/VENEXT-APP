import { BadRequestException, Injectable } from "@nestjs/common";
import {
  RelationalOrderExecutionEventType,
  RelationalOrderExecutionStatus,
} from "@prisma/client";

type TransitionKey = `${RelationalOrderExecutionStatus}->${RelationalOrderExecutionStatus}`;

const LINEAR_FORWARD: TransitionKey[] = [
  "CREATED->PREPARING",
  "PREPARING->READY_FOR_DISPATCH",
  "READY_FOR_DISPATCH->DISPATCHED",
  "DISPATCHED->IN_TRANSIT",
  "IN_TRANSIT->ARRIVED",
  "ARRIVED->RECEIVED",
  "RECEIVED->COMPLETED",
];

const LINEAR_EVENT: Partial<Record<TransitionKey, RelationalOrderExecutionEventType>> = {
  "CREATED->PREPARING": "PREPARATION_STARTED",
  "PREPARING->READY_FOR_DISPATCH": "PREPARATION_COMPLETED",
  "READY_FOR_DISPATCH->DISPATCHED": "DISPATCH_CONFIRMED",
  "DISPATCHED->IN_TRANSIT": "TRANSIT_STARTED",
  "IN_TRANSIT->ARRIVED": "ARRIVAL_CONFIRMED",
  "ARRIVED->RECEIVED": "RECEPTION_CONFIRMED",
  "RECEIVED->COMPLETED": "EXECUTION_COMPLETED",
};

const EXCEPTION_MATRIX: TransitionKey[] = [
  "CREATED->BLOCKED",
  "PREPARING->BLOCKED",
  "READY_FOR_DISPATCH->BLOCKED",
  "DISPATCHED->BLOCKED",
  "IN_TRANSIT->BLOCKED",
  "ARRIVED->BLOCKED",
  "PREPARING->PARTIALLY_FULFILLED",
  "READY_FOR_DISPATCH->PARTIALLY_FULFILLED",
  "ARRIVED->REJECTED_AT_RECEPTION",
  "CREATED->CANCELLED",
  "PREPARING->CANCELLED",
  "READY_FOR_DISPATCH->CANCELLED",
  "DISPATCHED->CANCELLED",
  "IN_TRANSIT->CANCELLED",
  "RECEIVED->RETURN_REVIEW",
  "RETURN_REVIEW->COMPLETED",
  "RETURN_REVIEW->CANCELLED",
  "PARTIALLY_FULFILLED->COMPLETED",
  "PARTIALLY_FULFILLED->BLOCKED",
];

const EXCEPTION_EVENT: Partial<Record<TransitionKey, RelationalOrderExecutionEventType>> = {
  "CREATED->BLOCKED": "EXECUTION_BLOCKED",
  "PREPARING->BLOCKED": "EXECUTION_BLOCKED",
  "READY_FOR_DISPATCH->BLOCKED": "EXECUTION_BLOCKED",
  "DISPATCHED->BLOCKED": "EXECUTION_BLOCKED",
  "IN_TRANSIT->BLOCKED": "EXECUTION_BLOCKED",
  "ARRIVED->BLOCKED": "EXECUTION_BLOCKED",
  "PREPARING->PARTIALLY_FULFILLED": "PARTIAL_FULFILLMENT_DECLARED",
  "READY_FOR_DISPATCH->PARTIALLY_FULFILLED": "PARTIAL_FULFILLMENT_DECLARED",
  "ARRIVED->REJECTED_AT_RECEPTION": "RECEPTION_REJECTED",
  "CREATED->CANCELLED": "EXECUTION_CANCELLED",
  "PREPARING->CANCELLED": "EXECUTION_CANCELLED",
  "READY_FOR_DISPATCH->CANCELLED": "EXECUTION_CANCELLED",
  "DISPATCHED->CANCELLED": "EXECUTION_CANCELLED",
  "IN_TRANSIT->CANCELLED": "EXECUTION_CANCELLED",
  "RECEIVED->RETURN_REVIEW": "RETURN_REVIEW_REQUESTED",
  "RETURN_REVIEW->COMPLETED": "EXECUTION_COMPLETED",
  "RETURN_REVIEW->CANCELLED": "EXECUTION_CANCELLED",
  "PARTIALLY_FULFILLED->COMPLETED": "EXECUTION_COMPLETED",
  "PARTIALLY_FULFILLED->BLOCKED": "EXECUTION_BLOCKED",
};

const TERMINAL: RelationalOrderExecutionStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "REJECTED_AT_RECEPTION",
  "BLOCKED",
];

@Injectable()
export class RelationalOrderExecutionPolicyService {
  assertTransitionAllowed(from: RelationalOrderExecutionStatus, to: RelationalOrderExecutionStatus): void {
    if (from === to) {
      return;
    }
    if (TERMINAL.includes(from)) {
      throw new BadRequestException({ code: "relational_order_execution_terminal_no_transition", detail: from });
    }
    const key = `${from}->${to}` as TransitionKey;
    if (LINEAR_FORWARD.includes(key)) {
      return;
    }
    if (EXCEPTION_MATRIX.includes(key) && EXCEPTION_EVENT[key]) {
      return;
    }
    throw new BadRequestException({ code: "relational_order_execution_transition_forbidden", detail: key });
  }

  resolveEventType(
    from: RelationalOrderExecutionStatus,
    to: RelationalOrderExecutionStatus,
  ): RelationalOrderExecutionEventType {
    if (from === to) {
      throw new BadRequestException({ code: "relational_order_execution_noop_event" });
    }
    const key = `${from}->${to}` as TransitionKey;
    const linear = LINEAR_EVENT[key];
    if (linear) return linear;
    const ex = EXCEPTION_EVENT[key];
    if (ex) return ex;
    throw new BadRequestException({ code: "relational_order_execution_event_unresolved", detail: key });
  }

  isTerminal(status: RelationalOrderExecutionStatus): boolean {
    return TERMINAL.includes(status);
  }
}
