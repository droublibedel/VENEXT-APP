import type {
  RelationalFulfillmentIncidentType,
  RelationalFulfillmentProofType,
  RelationalFulfillmentStatus,
} from "@prisma/client";

export type FulfillmentTransitionKey = `${RelationalFulfillmentStatus}->${RelationalFulfillmentStatus}`;

export const TERMINAL_FULFILLMENT_STATUSES: RelationalFulfillmentStatus[] = [
  "FULFILLMENT_COMPLETED",
  "FULFILLMENT_BLOCKED",
  "RECEPTION_REJECTED",
];

export const ALLOWED_PROOF_TYPES: RelationalFulfillmentProofType[] = [
  "RECEIPT_PHOTO",
  "RECEIPT_DOCUMENT",
  "RECEIPT_SIGNATURE_SCAN",
  "LOADING_DOCUMENT",
  "DAMAGE_EVIDENCE",
];

export const ALLOWED_INCIDENT_TYPES: RelationalFulfillmentIncidentType[] = [
  "DAMAGED_GOODS",
  "PARTIAL_RECEPTION",
  "DOCUMENT_MISMATCH",
  "QUANTITY_MISMATCH",
  "PACKAGING_ISSUE",
  "FULFILLMENT_DELAY",
  "UNAUTHORIZED_SUBSTITUTION",
];

/** Instruction 20.9A — generic transition must not reach these (domain endpoints only). */
export const SENSITIVE_FULFILLMENT_TRANSITION_TARGETS: RelationalFulfillmentStatus[] = [
  "RECEPTION_VALIDATED",
  "FULFILLMENT_COMPLETED",
  "RECEPTION_PARTIALLY_VALIDATED",
  "RECEPTION_REJECTED",
];

/** Instruction 20.9A — incidents that block fulfillment completion until resolved. */
export const BLOCKING_FULFILLMENT_INCIDENT_TYPES: RelationalFulfillmentIncidentType[] = [
  "UNAUTHORIZED_SUBSTITUTION",
  "DOCUMENT_MISMATCH",
  "QUANTITY_MISMATCH",
];

export const NON_BLOCKING_FULFILLMENT_INCIDENT_TYPES: RelationalFulfillmentIncidentType[] = [
  "FULFILLMENT_DELAY",
  "PACKAGING_ISSUE",
];

export function isBlockingFulfillmentIncidentType(type: RelationalFulfillmentIncidentType): boolean {
  return BLOCKING_FULFILLMENT_INCIDENT_TYPES.includes(type) || type === "PARTIAL_RECEPTION" || type === "DAMAGED_GOODS";
}

export function incidentSeverityClass(type: RelationalFulfillmentIncidentType): "BLOCKING" | "NON_BLOCKING" {
  if (BLOCKING_FULFILLMENT_INCIDENT_TYPES.includes(type) || type === "PARTIAL_RECEPTION" || type === "DAMAGED_GOODS") {
    return "BLOCKING";
  }
  return "NON_BLOCKING";
}
