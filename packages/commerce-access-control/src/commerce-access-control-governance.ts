import {
  canExposeCatalogAcrossRelationship,
  isCommercialRelationshipGovernanceEnabled,
  resolveRelationshipGovernance,
  shouldUseMailForRelationship,
} from "commercial-relationship-governance";
import type { ActorPair } from "commercial-relationship-governance";

import type {
  CommerceAccessActorRole,
  CommerceAccessContext,
  CommerceAccessFlags,
  GovRole,
} from "./commerce-access-control.types";

export function isCommerceAccessControlEnabled(flags: CommerceAccessFlags = {}): boolean {
  return flags.commerce_access_control_enabled !== false;
}

export function isVisibilityGuardEnabled(flags: CommerceAccessFlags = {}): boolean {
  return (
    flags.commerce_visibility_guard_enabled !== false &&
    isCommerceAccessControlEnabled(flags)
  );
}

export function isBackendAccessGuardEnabled(flags: CommerceAccessFlags = {}): boolean {
  return (
    flags.commerce_backend_access_guard_enabled !== false &&
    isCommerceAccessControlEnabled(flags)
  );
}

export function toGovRole(role: CommerceAccessActorRole): GovRole {
  switch (role) {
    case "PRODUCER":
      return "producteur";
    case "GROSSISTE_A":
      return "grossiste_a";
    case "GROSSISTE_B":
      return "grossiste_b";
    case "DETAILLANT":
      return "detaillant";
  }
}

export function buildActorPair(ctx: CommerceAccessContext): ActorPair {
  return {
    self: toGovRole(ctx.actorRole),
    partner: toGovRole(ctx.partnerRole ?? ctx.actorRole),
  };
}

export function resolveAccessGovernance(ctx: CommerceAccessContext) {
  const flags = ctx.flags ?? {};
  if (!isCommercialRelationshipGovernanceEnabled(flags)) {
    return null;
  }
  return resolveRelationshipGovernance(buildActorPair(ctx), {
    flags,
    level: (ctx.relationshipLevel as never) ?? "RETAIL_PARTNER",
  });
}

export function isRelationshipActive(ctx: CommerceAccessContext): boolean {
  if (!ctx.relationshipId) return false;
  const status = ctx.relationshipStatus ?? "ACTIVE";
  return status === "ACTIVE" || status === "PENDING";
}

export function isFormalActor(role: CommerceAccessActorRole): boolean {
  return role === "PRODUCER" || role === "GROSSISTE_A";
}

export function isTerrainActor(role: CommerceAccessActorRole): boolean {
  return role === "GROSSISTE_B" || role === "DETAILLANT";
}

export function allowsCatalogExposure(ctx: CommerceAccessContext): boolean {
  if (ctx.catalogVisibility === "HIDDEN" || ctx.catalogVisibility === "GLOBAL") return false;
  const gov = resolveAccessGovernance(ctx);
  if (!gov) return Boolean(ctx.relationshipId);
  return canExposeCatalogAcrossRelationship(buildActorPair(ctx), ctx.flags ?? {});
}

export function prefersMail(ctx: CommerceAccessContext): boolean {
  return shouldUseMailForRelationship(buildActorPair(ctx), ctx.flags ?? {});
}

export function isOrderParty(ctx: CommerceAccessContext): boolean {
  const org = ctx.organizationId;
  return org === ctx.buyerOrganizationId || org === ctx.sellerOrganizationId;
}
