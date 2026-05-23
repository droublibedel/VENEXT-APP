import {
  buildAccessContext,
  guardCatalogAction,
  withCatalogAccess,
  withCatalogActionAccess,
  withQuickOrderAccess,
  type CommerceAccessContext,
} from "commerce-access-control";

import type { RelationalActorRole, RelationalCatalog, RelationalCatalogFlags } from "./relational-commerce-catalog.types";
import { canViewCatalog as legacyCanViewCatalog } from "./relational-commerce-catalog-governance";

export type CatalogAccessBridgeInput = {
  viewerRole?: RelationalActorRole;
  organizationId?: string;
  relationshipId?: string;
  relationshipStatus?: "ACTIVE" | "SUSPENDED" | "REMOVED" | "PENDING";
  catalogVisibility?: CommerceAccessContext["catalogVisibility"];
  flags?: RelationalCatalogFlags & {
    commerce_access_control_enabled?: boolean;
    commerce_visibility_guard_enabled?: boolean;
  };
};

function toAccessRole(role?: RelationalActorRole): CommerceAccessContext["actorRole"] {
  switch (role) {
    case "producteur":
      return "PRODUCER";
    case "grossiste_a":
      return "GROSSISTE_A";
    case "grossiste_b":
      return "GROSSISTE_B";
    case "detaillant":
      return "DETAILLANT";
    default:
      return "GROSSISTE_B";
  }
}

export function buildCatalogAccessContext(input: CatalogAccessBridgeInput): CommerceAccessContext {
  return buildAccessContext({
    actorRole: toAccessRole(input.viewerRole),
    organizationId: input.organizationId ?? "org-local",
    relationshipId: input.relationshipId,
    relationshipStatus: input.relationshipStatus ?? "ACTIVE",
    catalogVisibility: input.catalogVisibility ?? "RELATION_ONLY",
    flags: input.flags,
  });
}

export function canViewCatalogWithAccessControl(
  catalog: RelationalCatalog,
  flags: RelationalCatalogFlags = {},
  viewerRole?: RelationalActorRole,
  bridge?: CatalogAccessBridgeInput,
): boolean {
  const legacy = legacyCanViewCatalog(catalog, flags, viewerRole);
  if (!bridge) return legacy;
  const ctx = buildCatalogAccessContext({
    ...bridge,
    viewerRole,
    catalogVisibility: mapVisibility(catalog.visibilityMode),
    flags,
  });
  return withCatalogAccess(ctx, () => legacy) && guardCatalogAction(ctx, "view").allowed;
}

function mapVisibility(
  mode: RelationalCatalog["visibilityMode"],
): CommerceAccessContext["catalogVisibility"] {
  if (mode === "SPONSORED_DISCOVERY") return "SPONSORED";
  if (mode === "HIDDEN") return "HIDDEN";
  if (mode === "PARTNER_APPROVED") return "PARTNER_APPROVED";
  return "RELATION_ONLY";
}

export function canQuickOrderCatalog(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  return withQuickOrderAccess(ctx, fallback);
}

export function canBrowseCatalog(ctx: CommerceAccessContext): boolean {
  return withCatalogActionAccess(ctx, "browse", () => true);
}
