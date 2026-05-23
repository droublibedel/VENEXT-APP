import { ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { devAuthBypassEnabled, isProductionRuntime } from "./venext-auth-context";
import type { VenextRequestActor } from "./venext-authz.types";

@Injectable()
export class RelationshipAccessService {
  private readonly log = new Logger(RelationshipAccessService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Caller org (header) must be upstream or downstream on the relationship when auth is present.
   */
  async assertParticipantOrgOrBypass(actor: VenextRequestActor, relationshipId: string): Promise<void> {
    if (devAuthBypassEnabled()) {
      this.log.warn(`DEV_AUTH_BYPASS: relationship access skipped (rel=${relationshipId})`);
      return;
    }
    if (!isProductionRuntime() && !actor.organizationId) return;

    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { upstreamOrganizationId: true, downstreamOrganizationId: true },
    });
    if (!rel) throw new NotFoundException(relationshipId);

    if (!actor.organizationId) {
      throw new ForbiddenException({ code: "venext_auth_missing_acting_org", relationshipId });
    }
    const ok =
      rel.upstreamOrganizationId === actor.organizationId ||
      rel.downstreamOrganizationId === actor.organizationId;
    if (!ok) {
      throw new ForbiddenException({
        code: "venext_relationship_not_participant",
        relationshipId,
        actingOrganizationId: actor.organizationId,
      });
    }
  }
}
