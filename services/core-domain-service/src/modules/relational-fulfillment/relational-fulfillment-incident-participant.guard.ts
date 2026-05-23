import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CommerceThreadActorResolver,
  type CommerceThreadResolvedActor,
} from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";

export const VENEXT_FULFILLMENT_INCIDENT_KEY = "venextFulfillmentIncident";

/** Instruction 20.10 — incident routes: buyer/seller on linked fulfillment record only. */
@Injectable()
export class RelationalFulfillmentIncidentParticipantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<
      VenextHttpLike & {
        [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor;
        [VENEXT_FULFILLMENT_INCIDENT_KEY]?: {
          incidentId: string;
          fulfillmentRecordId: string;
          buyerOrganizationId: string;
          sellerOrganizationId: string;
        };
      }
    >();
    const incidentId = req.params?.incidentId;
    if (!incidentId || typeof incidentId !== "string") {
      throw new ForbiddenException({ code: "relational_fulfillment_missing_incident_id" });
    }

    const resolved = this.resolver.resolveFromRequest(req);
    const incident = await this.prisma.relationalFulfillmentIncident.findUnique({
      where: { id: incidentId },
      include: {
        fulfillmentRecord: {
          select: {
            id: true,
            buyerOrganizationId: true,
            sellerOrganizationId: true,
            fulfillmentStatus: true,
          },
        },
      },
    });
    if (!incident?.fulfillmentRecord) throw new NotFoundException(incidentId);

    const { buyerOrganizationId, sellerOrganizationId } = incident.fulfillmentRecord;
    if (resolved.organizationId !== buyerOrganizationId && resolved.organizationId !== sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }

    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );

    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    req[VENEXT_FULFILLMENT_INCIDENT_KEY] = {
      incidentId,
      fulfillmentRecordId: incident.fulfillmentRecord.id,
      buyerOrganizationId,
      sellerOrganizationId,
    };
    return true;
  }
}
