import type { RelationalFulfillmentIncident } from "@prisma/client";

export function mapIncidentToDto(incident: RelationalFulfillmentIncident) {
  const meta = incident.metadata as { blocksFulfillmentCompletion?: boolean } | null;
  return {
    id: incident.id,
    fulfillmentRecordId: incident.fulfillmentRecordId,
    incidentType: incident.incidentType,
    reportedByOrganizationId: incident.reportedByOrganizationId,
    reportedByUserId: incident.reportedByUserId,
    description: incident.description,
    severity: incident.severity,
    resolutionStatus: incident.resolutionStatus,
    resolutionRequestedAt: incident.resolutionRequestedAt?.toISOString() ?? null,
    resolutionProposal: incident.resolutionProposal,
    sellerResolutionAcceptedAt: incident.sellerResolutionAcceptedAt?.toISOString() ?? null,
    buyerResolutionAcceptedAt: incident.buyerResolutionAcceptedAt?.toISOString() ?? null,
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
    resolutionNotes: incident.resolutionNotes,
    blocksFulfillmentCompletion:
      meta?.blocksFulfillmentCompletion === true && incident.resolutionStatus !== "RESOLVED",
    createdAt: incident.createdAt.toISOString(),
  };
}

export function incidentBlocksCompletion(incident: {
  incidentType: import("@prisma/client").RelationalFulfillmentIncidentType;
  resolutionStatus: import("@prisma/client").RelationalFulfillmentIncidentResolutionStatus;
  metadata: unknown;
}): boolean {
  if (incident.resolutionStatus === "RESOLVED") return false;
  const meta = incident.metadata as { blocksFulfillmentCompletion?: boolean } | null;
  if (meta?.blocksFulfillmentCompletion === true) return true;
  const blockingTypes: import("@prisma/client").RelationalFulfillmentIncidentType[] = [
    "UNAUTHORIZED_SUBSTITUTION",
    "DOCUMENT_MISMATCH",
    "QUANTITY_MISMATCH",
    "PARTIAL_RECEPTION",
    "DAMAGED_GOODS",
  ];
  return blockingTypes.includes(incident.incidentType);
}
