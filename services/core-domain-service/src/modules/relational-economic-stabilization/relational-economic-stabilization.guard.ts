import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import {
  CommerceThreadActorResolver,
  type CommerceThreadResolvedActor,
} from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";

@Injectable()
export class RelationalEconomicStabilizationGuard implements CanActivate {
  constructor(
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<
      VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }
    >();
    const org = typeof req.query?.organizationId === "string" ? req.query.organizationId : null;
    if (!org) throw new ForbiddenException({ code: "relational_economic_stabilization_missing_organization" });
    const resolved = this.resolver.resolveFromRequest(req);
    if (resolved.organizationId !== org) {
      throw new ForbiddenException({ code: "relational_economic_stabilization_org_mismatch" });
    }
    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );
    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    return true;
  }
}
