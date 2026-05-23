import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { PrismaService } from "../../prisma/prisma.service";
import { CommerceThreadActorResolver, type CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";

/** Instruction 20.8 — relational order execution `:orderId` routes — buyer/seller orgs only. */
@Injectable()
export class RelationalOrderExecutionParticipantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }>();
    const orderId = req.params?.orderId;
    if (!orderId || typeof orderId !== "string") {
      throw new ForbiddenException({ code: "venext_commerce_missing_order" });
    }

    const resolved = this.resolver.resolveFromRequest(req);
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerOrganizationId: true, sellerOrganizationId: true },
    });
    if (!order) throw new NotFoundException(orderId);

    if (resolved.organizationId !== order.buyerOrganizationId && resolved.organizationId !== order.sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_order_execution_participant_only" });
    }

    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );

    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    return true;
  }
}
