import type { TemporaryCommercialHandshakeState } from "@prisma/client";

/** Instruction 20.2B — minimal WS payload (no catalogue, no messages). */
export function buildSponsoredMaintenanceWsBody(input: {
  windowId: string;
  campaignId: string;
  sponsorOrganizationId: string;
  targetOrganizationId: string;
  relationshipId: string | null;
  sponsoredScopeValidated: boolean;
  temporaryCommercialHandshake: boolean;
  relationshipStillRequired: boolean;
  previousWindowState?: TemporaryCommercialHandshakeState;
}): Record<string, unknown> {
  return {
    windowId: input.windowId,
    campaignId: input.campaignId,
    sponsorOrganizationId: input.sponsorOrganizationId,
    targetOrganizationId: input.targetOrganizationId,
    relationshipId: input.relationshipId,
    sponsoredScopeValidated: input.sponsoredScopeValidated,
    temporaryCommercialHandshake: input.temporaryCommercialHandshake,
    relationshipStillRequired: input.relationshipStillRequired,
    ...(input.previousWindowState != null ? { previousWindowState: input.previousWindowState } : {}),
  };
}
