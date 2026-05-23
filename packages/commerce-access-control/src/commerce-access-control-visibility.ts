import type { CommerceAccessContext, CommerceAccessResource } from "./commerce-access-control.types";
import {
  allowsCatalogExposure,
  isOrderParty,
  isRelationshipActive,
  isTerrainActor,
  prefersMail,
  resolveAccessGovernance,
} from "./commerce-access-control-governance";

export function isGlobalCatalogForbidden(ctx: CommerceAccessContext): boolean {
  return ctx.catalogVisibility === "GLOBAL" || !ctx.relationshipId;
}

export function canSeeResource(
  ctx: CommerceAccessContext,
  resource: CommerceAccessResource,
): boolean {
  switch (resource) {
    case "relational_catalog":
      if (isGlobalCatalogForbidden(ctx)) return false;
      if (!isRelationshipActive(ctx) && ctx.relationshipId) return false;
      return allowsCatalogExposure(ctx);
    case "order":
      return isOrderParty(ctx) || Boolean(ctx.relationshipId && isRelationshipActive(ctx));
    case "delivery":
      return canSeeResource(ctx, "order");
    case "settlement":
      return (
        canSeeResource(ctx, "order") ||
        ctx.organizationId === ctx.walletOwnerOrganizationId
      );
    case "wallet":
      return ctx.organizationId === ctx.walletOwnerOrganizationId;
    case "messaging":
      if (prefersMail(ctx)) return false;
      return isTerrainActor(ctx.actorRole) || resolveAccessGovernance(ctx)?.preferMessaging === true;
    case "mail":
      return prefersMail(ctx) || !isTerrainActor(ctx.actorRole);
    case "notifications":
    case "activity_feed":
    case "partner_profile":
    case "relationship":
      return Boolean(ctx.relationshipId ? isRelationshipActive(ctx) : true);
    case "offline_cache":
      if (!ctx.relationshipId) return false;
      return canSeeResource(ctx, "relational_catalog") || canSeeResource(ctx, "order");
    default:
      return false;
  }
}

export function assertNoUrlBypass(ctx: CommerceAccessContext, requestedOrgId?: string): boolean {
  if (!requestedOrgId) return true;
  if (requestedOrgId === ctx.organizationId) return true;
  if (requestedOrgId === ctx.partnerOrganizationId && ctx.relationshipId) return true;
  return false;
}
