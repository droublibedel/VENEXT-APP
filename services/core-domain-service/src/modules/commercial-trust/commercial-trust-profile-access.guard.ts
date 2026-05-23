import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { devAuthBypassEnabled, parseVenextActorFromRequest } from "../../platform-authz/venext-auth-context";

/**
 * Instruction 20.3A — no anonymous commercial trust profile reads.
 * Visibility rules remain in CommercialTrustVisibilityService; this guard enforces a resolved actor boundary.
 */
@Injectable()
export class CommercialTrustProfileAccessGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    if (devAuthBypassEnabled()) {
      return true;
    }
    const req = ctx.switchToHttp().getRequest<VenextHttpLike>();
    const actor = parseVenextActorFromRequest(req);
    if (actor.backofficeCommercialTrustFull) {
      return true;
    }
    const org = actor.organizationId?.trim();
    if (!org) {
      throw new ForbiddenException({
        code: "commercial_trust_profile_actor_required",
        detail: "Lecture profil confiance corridor — actingOrganizationId obligatoire (pas d’accès anonyme).",
      });
    }
    return true;
  }
}
