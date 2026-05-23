import type { Prisma } from "@prisma/client";

/** Relationships where the organization participates anywhere on the edge. */
export function relationshipWhereOrgParticipates(organizationId: string): Prisma.RelationshipWhereInput {
  return {
    OR: [
      { requesterOrganizationId: organizationId },
      { receiverOrganizationId: organizationId },
      { upstreamOrganizationId: organizationId },
      { downstreamOrganizationId: organizationId },
    ],
  };
}

export function orderWhereOrgParticipates(organizationId: string): Prisma.OrderWhereInput {
  return {
    OR: [{ buyerOrganizationId: organizationId }, { sellerOrganizationId: organizationId }],
  };
}
