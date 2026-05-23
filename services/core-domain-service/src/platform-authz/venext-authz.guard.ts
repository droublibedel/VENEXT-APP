import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { devAuthBypassEnabled, isProductionRuntime, parseVenextActorFromRequest, type VenextHttpLike } from "./venext-auth-context";
import { OrganizationAccessService } from "./organization-access.service";
import { RelationshipAccessService } from "./relationship-access.service";
import { VENEXT_AUTHZ, type VenextAuthzRule } from "./venext-authz.decorators";

@Injectable()
export class VenextAuthzGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly orgAccess: OrganizationAccessService,
    private readonly relAccess: RelationshipAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.getAllAndOverride<VenextAuthzRule | undefined>(VENEXT_AUTHZ, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!rule) return true;

    const req = ctx.switchToHttp().getRequest<VenextHttpLike>();
    const actor = parseVenextActorFromRequest(req);

    if (rule.type === "orgRoute") {
      const orgId = req.params[rule.orgParam] as string | undefined;
      if (!orgId) return true;
      this.orgAccess.assertHeaderOrgMatchesParam(actor, orgId);
      await this.orgAccess.assertMemberOrBypass(actor, orgId);
      return true;
    }

    if (rule.type === "orgQuery") {
      const raw = req.query[rule.queryKey];
      const orgId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
      if (!orgId) return true;
      this.orgAccess.assertHeaderOrgMatchesParam(actor, orgId);
      await this.orgAccess.assertMemberOrBypass(actor, orgId);
      return true;
    }

    if (rule.type === "relationshipRoute") {
      const p = rule.relationshipParam ?? "relationshipId";
      const rid = (req.params[p] ?? req.query[p]) as string | undefined;
      if (!rid || typeof rid !== "string") return true;
      await this.relAccess.assertParticipantOrgOrBypass(actor, rid);

      const actingRaw = req.query["actingOrganizationId"];
      const actingStr =
        typeof actingRaw === "string" ? actingRaw : Array.isArray(actingRaw) ? actingRaw[0] : undefined;
      if (actingStr && !devAuthBypassEnabled()) {
        if (isProductionRuntime() || actor.organizationId) {
          if (!actor.organizationId) {
            throw new ForbiddenException({ code: "venext_auth_missing_acting_org" });
          }
          if (actingStr !== actor.organizationId) {
            throw new ForbiddenException({
              code: "venext_acting_org_mismatch",
              actingOrganizationId: actingStr,
              headerOrganizationId: actor.organizationId,
            });
          }
        }
      }
      return true;
    }

    if (rule.type === "contactSyncBodyUser") {
      const body = req.body as { userId?: string };
      if (!body?.userId) throw new ForbiddenException({ code: "venext_contact_sync_missing_user" });
      if (devAuthBypassEnabled()) return true;
      if (!isProductionRuntime() && !actor.userId) return true;
      if (actor.userId && body.userId !== actor.userId) {
        throw new ForbiddenException({
          code: "venext_contact_user_mismatch",
          bodyUserId: body.userId,
          headerUserId: actor.userId,
        });
      }
      if (isProductionRuntime() && !actor.userId) {
        throw new ForbiddenException({ code: "venext_auth_missing_user" });
      }
      return true;
    }

    if (rule.type === "userSelfRoute") {
      const uid = req.params[rule.userParam] as string | undefined;
      if (!uid) return true;
      if (devAuthBypassEnabled()) return true;
      if (!isProductionRuntime() && !actor.userId) return true;
      if (!actor.userId) throw new ForbiddenException({ code: "venext_auth_missing_user" });
      if (actor.userId !== uid) {
        throw new ForbiddenException({
          code: "venext_user_route_mismatch",
          paramUserId: uid,
          headerUserId: actor.userId,
        });
      }
      return true;
    }

    return true;
  }
}
