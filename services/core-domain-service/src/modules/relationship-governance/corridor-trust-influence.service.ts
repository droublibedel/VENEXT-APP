import { Injectable } from "@nestjs/common";
import { CommercialCorridorState, RelationshipStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

const MAX_REL_SAMPLE = 16;

/**
 * Instruction 20.4 — corridor influences org trust slightly; it does not replace org trust model.
 * Bounded modifier in [-8, 0] trust score points.
 */
@Injectable()
export class CorridorTrustInfluenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrustScoreModifierForOrganization(organizationId: string): Promise<number> {
    const orgId = organizationId.trim();
    const rels = await this.prisma.relationship.findMany({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [
          { requesterOrganizationId: orgId },
          { receiverOrganizationId: orgId },
          { upstreamOrganizationId: orgId },
          { downstreamOrganizationId: orgId },
        ],
      },
      take: MAX_REL_SAMPLE,
      select: { corridorHealthScore: true, corridorState: true },
    });
    let penalty = 0;
    for (const r of rels) {
      if (
        r.corridorState === CommercialCorridorState.DEGRADED ||
        r.corridorState === CommercialCorridorState.RESTRICTED ||
        r.corridorState === CommercialCorridorState.SUSPENDED ||
        r.corridorState === CommercialCorridorState.BLOCKED
      ) {
        penalty += 2;
      }
      if (r.corridorHealthScore < 32) penalty += 2;
      if (r.corridorState === CommercialCorridorState.DORMANT) penalty += 1;
    }
    return Math.max(-8, -Math.min(8, penalty));
  }
}
