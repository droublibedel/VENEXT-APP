import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { CommerceThreadActorResolver, type CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";

/** Instruction 20.6 — from-catalog body must name buyer/seller orgs; actor must be one of them. */
@Injectable()
export class RelationalCartDirectCatalogGuard implements CanActivate {
  constructor(
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }>();
    const resolved = this.resolver.resolveFromRequest(req);
    const body = req.body as { buyerOrganizationId?: unknown; sellerOrganizationId?: unknown };
    const buyer = typeof body.buyerOrganizationId === "string" ? body.buyerOrganizationId.trim() : "";
    const seller = typeof body.sellerOrganizationId === "string" ? body.sellerOrganizationId.trim() : "";
    if (!buyer || !seller) {
      throw new ForbiddenException({ code: "relational_cart_direct_catalog_missing_orgs" });
    }
    if (resolved.organizationId !== buyer && resolved.organizationId !== seller) {
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
