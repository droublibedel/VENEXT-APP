import type { Prisma } from "@prisma/client";
import { RelationshipStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

/** Row shape for counting / eligibility (Instruction 20.3A — single source of truth). */
export type AcceptedCommercialRelationshipRow = {
  status: RelationshipStatus;
  upstreamOrganizationId: string | null;
  downstreamOrganizationId: string | null;
  requesterOrganizationId: string | null;
  receiverOrganizationId: string | null;
};

/** Accepted corridor involving org — upstream/downstream and requester/receiver (Instruction 20.3A alignment). */
export function acceptedRelationshipWhereForOrg(organizationId: string): Prisma.RelationshipWhereInput {
  return {
    status: RelationshipStatus.ACCEPTED,
    OR: [
      { upstreamOrganizationId: organizationId },
      { downstreamOrganizationId: organizationId },
      { requesterOrganizationId: organizationId },
      { receiverOrganizationId: organizationId },
    ],
  };
}

/** Distinct accepted relationships for org (one row per relationship id). */
export async function countDistinctAcceptedRelationships(prisma: PrismaService, organizationId: string): Promise<number> {
  const rows = await prisma.relationship.findMany({
    where: acceptedRelationshipWhereForOrg(organizationId),
    select: { id: true },
  });
  return rows.length;
}

/**
 * True if `orgId` participates in this relationship row and it is ACCEPTED (any supported edge field).
 * Use for analytics / dedup logic — counting remains `countDistinctAcceptedRelationships` (one row = one id).
 */
export function isAcceptedCommercialRelationshipForOrg(orgId: string, rel: AcceptedCommercialRelationshipRow): boolean {
  if (rel.status !== RelationshipStatus.ACCEPTED) return false;
  const parties = [
    rel.upstreamOrganizationId,
    rel.downstreamOrganizationId,
    rel.requesterOrganizationId,
    rel.receiverOrganizationId,
  ].filter(Boolean) as string[];
  return parties.includes(orgId);
}

export async function hasAcceptedRelationshipBetween(
  prisma: PrismaService,
  organizationA: string,
  organizationB: string,
): Promise<boolean> {
  const r = await prisma.relationship.findFirst({
    where: {
      status: RelationshipStatus.ACCEPTED,
      OR: [
        { upstreamOrganizationId: organizationA, downstreamOrganizationId: organizationB },
        { upstreamOrganizationId: organizationB, downstreamOrganizationId: organizationA },
        { requesterOrganizationId: organizationA, receiverOrganizationId: organizationB },
        { requesterOrganizationId: organizationB, receiverOrganizationId: organizationA },
      ],
    },
    select: { id: true },
  });
  return Boolean(r);
}
