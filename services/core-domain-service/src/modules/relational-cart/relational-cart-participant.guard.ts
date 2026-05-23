import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { PrismaService } from "../../prisma/prisma.service";
import { CommerceThreadActorResolver, type CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";

/** Instruction 20.5 — relational cart `:cartId` routes — buyer/seller orgs only. */
@Injectable()
export class RelationalCartParticipantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }>();
    const cartId = req.params?.cartId;
    if (!cartId || typeof cartId !== "string") {
      throw new ForbiddenException({ code: "venext_commerce_missing_cart" });
    }

    const resolved = this.resolver.resolveFromRequest(req);
    const cart = await this.prisma.relationalCart.findUnique({
      where: { id: cartId },
      select: { id: true, buyerOrganizationId: true, sellerOrganizationId: true },
    });
    if (!cart) throw new NotFoundException(cartId);

    if (resolved.organizationId !== cart.buyerOrganizationId && resolved.organizationId !== cart.sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_cart_participant_only" });
    }

    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );

    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    return true;
  }
}
