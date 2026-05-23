import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { devAuthBypassEnabled, parseVenextActorFromRequest } from "../../platform-authz/venext-auth-context";

/** Instruction 20.4 — no anonymous corridor intelligence reads. */
@Injectable()
export class RelationshipIntelligenceAccessGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    if (devAuthBypassEnabled()) return true;
    const req = ctx.switchToHttp().getRequest<VenextHttpLike>();
    const actor = parseVenextActorFromRequest(req);
    if (actor.backofficeCommercialTrustFull) return true;
    const org = actor.organizationId?.trim();
    if (!org) {
      throw new ForbiddenException({
        code: "relationship_intelligence_actor_required",
        detail: "Intelligence corridor — actingOrganizationId obligatoire.",
      });
    }
    return true;
  }
}
