import { BadRequestException, Injectable } from "@nestjs/common";
import type { RelationalFulfillmentStatus } from "@prisma/client";

import {
  SENSITIVE_FULFILLMENT_TRANSITION_TARGETS,
  TERMINAL_FULFILLMENT_STATUSES,
  type FulfillmentTransitionKey,
} from "./relational-fulfillment.types";

const LINEAR: FulfillmentTransitionKey[] = [
  "PREPARING_FULFILLMENT->READY_FOR_LOADING",
  "READY_FOR_LOADING->LOADING_CONFIRMED",
  "LOADING_CONFIRMED->IN_TRANSFER",
  "IN_TRANSFER->ARRIVED_AT_DESTINATION",
  "ARRIVED_AT_DESTINATION->RECEPTION_PENDING_VALIDATION",
];

const EXCEPTIONS: FulfillmentTransitionKey[] = [
  "PREPARING_FULFILLMENT->FULFILLMENT_BLOCKED",
  "READY_FOR_LOADING->FULFILLMENT_BLOCKED",
  "LOADING_CONFIRMED->FULFILLMENT_BLOCKED",
  "IN_TRANSFER->FULFILLMENT_BLOCKED",
  "ARRIVED_AT_DESTINATION->INCIDENT_REPORTED",
  "RECEPTION_PENDING_VALIDATION->INCIDENT_REPORTED",
  "INCIDENT_REPORTED->RECEPTION_PENDING_VALIDATION",
  "INCIDENT_REPORTED->FULFILLMENT_BLOCKED",
];

@Injectable()
export class RelationalFulfillmentPolicyService {
  /** Instruction 20.9A — sensitive statuses require domain endpoints, not generic POST /transitions. */
  assertGenericTransitionTargetAllowed(targetStatus: RelationalFulfillmentStatus): void {
    if (!SENSITIVE_FULFILLMENT_TRANSITION_TARGETS.includes(targetStatus)) return;
    const endpoint =
      targetStatus === "RECEPTION_VALIDATED"
        ? "POST …/validate-reception"
        : targetStatus === "FULFILLMENT_COMPLETED"
          ? "completeFulfillmentIfExecutionAligned"
          : targetStatus === "RECEPTION_PARTIALLY_VALIDATED" || targetStatus === "RECEPTION_REJECTED"
            ? "POST …/report-incident"
            : "domain_endpoint";
    throw new BadRequestException({
      code: "fulfillment_sensitive_transition_requires_domain_endpoint",
      sensitiveTransitionBlocked: true,
      requiredDomainEndpoint: endpoint,
      attemptedTargetStatus: targetStatus,
    });
  }

  assertTransitionAllowed(from: RelationalFulfillmentStatus, to: RelationalFulfillmentStatus): void {
    if (from === to) return;
    this.assertGenericTransitionTargetAllowed(to);
    if (TERMINAL_FULFILLMENT_STATUSES.includes(from)) {
      throw new BadRequestException({ code: "relational_fulfillment_terminal_no_transition", detail: from });
    }
    const key = `${from}->${to}` as FulfillmentTransitionKey;
    if (LINEAR.includes(key) || EXCEPTIONS.includes(key)) return;
    throw new BadRequestException({ code: "relational_fulfillment_transition_forbidden", detail: key });
  }

  canValidateReception(status: RelationalFulfillmentStatus): boolean {
    return status === "ARRIVED_AT_DESTINATION" || status === "RECEPTION_PENDING_VALIDATION";
  }
}
