import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CommerceThreadActorResolver,
  type CommerceThreadResolvedActor,
} from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";

/** Instruction 20.9 — fulfillment routes: buyer/seller participants on the linked order only. */
@Injectable()
export class RelationalFulfillmentParticipantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }>();
    const id = req.params?.id;
    if (!id || typeof id !== "string") {
      throw new ForbiddenException({ code: "relational_fulfillment_missing_record_id" });
    }

    const resolved = this.resolver.resolveFromRequest(req);
    const record = await this.prisma.relationalFulfillmentRecord.findUnique({
      where: { id },
      select: { id: true, buyerOrganizationId: true, sellerOrganizationId: true },
    });
    if (!record) throw new NotFoundException(id);

    if (
      resolved.organizationId !== record.buyerOrganizationId &&
      resolved.organizationId !== record.sellerOrganizationId
    ) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }

    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );

    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    return true;
  }
}
