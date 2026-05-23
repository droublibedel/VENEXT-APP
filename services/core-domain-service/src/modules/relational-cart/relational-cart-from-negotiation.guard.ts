import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { PrismaService } from "../../prisma/prisma.service";
import { CommerceThreadActorResolver, type CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";

/** Instruction 20.5 — relational-cart route using `negotiationId` path param (same semantics as negotiation participant guard). */
@Injectable()
export class RelationalCartFromNegotiationGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }>();
    const negotiationId = req.params?.negotiationId;
    if (!negotiationId || typeof negotiationId !== "string") {
      throw new ForbiddenException({ code: "venext_commerce_missing_negotiation" });
    }

    const resolved = this.resolver.resolveFromRequest(req);
    const neg = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
      select: { id: true, buyerOrganizationId: true, sellerOrganizationId: true },
    });
    if (!neg) throw new NotFoundException(negotiationId);

    if (resolved.organizationId !== neg.buyerOrganizationId && resolved.organizationId !== neg.sellerOrganizationId) {
      throw new ForbiddenException({ code: "venext_commerce_negotiation_access_denied" });
    }

    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );

    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    return true;
  }
}
