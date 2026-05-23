import type { Prisma } from "@prisma/client";

export type CorridorEdge = {
  relationshipId: string;
  upstreamOrganizationId: string;
  downstreamOrganizationId: string;
};

/** Instruction 20.0A — map relationship → upstream/downstream endpoints from corridor edges. */
export function buildRelationshipEndpointMap(edges: CorridorEdge[]): Map<string, { up: string; down: string }> {
  const m = new Map<string, { up: string; down: string }>();
  for (const e of edges) {
    m.set(e.relationshipId, { up: e.upstreamOrganizationId, down: e.downstreamOrganizationId });
  }
  return m;
}

/** True iff buyer/seller are exactly the two relationship endpoints (either orientation). */
export function orderMatchesRelationshipEndpoints(
  relationshipId: string,
  buyerOrganizationId: string,
  sellerOrganizationId: string,
  map: Map<string, { up: string; down: string }>,
): boolean {
  const e = map.get(relationshipId);
  if (!e) return false;
  const ends = new Set([buyerOrganizationId, sellerOrganizationId]);
  return ends.size === 2 && ends.has(e.up) && ends.has(e.down);
}

/**
 * Instruction 20.0A — Prisma fragment: order rows whose buyer/seller align with relationship upstream/downstream.
 */
export function buildRelationshipDirectionWhere(
  relIds: string[],
  map: Map<string, { up: string; down: string }>,
): Prisma.OrderWhereInput {
  if (relIds.length === 0) return { relationshipId: { in: [] } };
  const ors: Prisma.OrderWhereInput[] = [];
  for (const rid of relIds) {
    const e = map.get(rid);
    if (!e) continue;
    ors.push({
      AND: [
        { relationshipId: rid },
        {
          OR: [
            { AND: [{ buyerOrganizationId: e.down }, { sellerOrganizationId: e.up }] },
            { AND: [{ buyerOrganizationId: e.up }, { sellerOrganizationId: e.down }] },
          ],
        },
      ],
    });
  }
  if (ors.length === 0) return { relationshipId: { in: [] } };
  return { OR: ors };
}
