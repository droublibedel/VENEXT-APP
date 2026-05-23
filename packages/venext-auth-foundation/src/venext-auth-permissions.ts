import type {
  VenextActorRole,
  VenextAuthFlags,
  VenextPermissionKey,
} from "./venext-auth.types";
import { isFormalActor, isTerrainActor, toGovernanceActorSlug } from "./venext-auth-actor";

export type VenextPermissionContext = {
  actorRole: VenextActorRole;
  flags?: VenextAuthFlags;
  relationshipFormal?: boolean;
  relationshipTerrain?: boolean;
};

export function isAuthFoundationEnabled(flags: VenextAuthFlags = {}): boolean {
  return flags.venext_auth_foundation_enabled !== false;
}

export function resolveCommercePermissions(ctx: VenextPermissionContext): Record<VenextPermissionKey, boolean> {
  const flags = ctx.flags ?? {};
  const formal = Boolean(isFormalActor(ctx.actorRole) || ctx.relationshipFormal);
  const terrain = Boolean(isTerrainActor(ctx.actorRole) || ctx.relationshipTerrain);

  return {
    canAccessFormalMail:
      formal && flags.professional_commercial_network_enabled !== false,
    canAccessTerrainMessaging:
      terrain && flags.grossiste_b_commerce_messaging_enabled !== false,
    canExposeRelationalCatalog: flags.relational_catalog_enabled !== false,
    canUseAutoAccept:
      terrain && flags.commercial_auto_accept_enabled !== false,
    canAccessCommercialDelivery: flags.commercial_delivery_flow_enabled !== false,
    canAccessSettlementFlows:
      flags.commercial_settlement_flow_enabled !== false ||
      flags.commerce_hybrid_settlement_enabled !== false,
  };
}

export function hasPermission(
  ctx: VenextPermissionContext,
  permission: VenextPermissionKey,
): boolean {
  return resolveCommercePermissions(ctx)[permission];
}

export function permissionLabel(permission: VenextPermissionKey): string {
  const labels: Record<VenextPermissionKey, string> = {
    canAccessFormalMail: "Mail professionnel partenaire",
    canAccessTerrainMessaging: "Messagerie terrain",
    canExposeRelationalCatalog: "Catalogue relationnel",
    canUseAutoAccept: "Acceptation automatique partenaires",
    canAccessCommercialDelivery: "Flux livraison commercial",
    canAccessSettlementFlows: "Règlements partenaires",
  };
  return labels[permission];
}

export function visiblePermissions(ctx: VenextPermissionContext): VenextPermissionKey[] {
  return (Object.entries(resolveCommercePermissions(ctx)) as [VenextPermissionKey, boolean][])
    .filter(([, allowed]) => allowed)
    .map(([key]) => key);
}

export function governanceActorFromRole(role: VenextActorRole): string {
  return toGovernanceActorSlug(role);
}
