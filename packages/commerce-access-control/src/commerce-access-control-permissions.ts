import type {
  CommerceAccessContext,
  CommercePermissions,
} from "./commerce-access-control.types";
import {
  isFormalActor,
  isRelationshipActive,
  isTerrainActor,
  resolveAccessGovernance,
} from "./commerce-access-control-governance";
import { canSeeResource } from "./commerce-access-control-visibility";

export function evaluateCommercePermissions(ctx: CommerceAccessContext): CommercePermissions {
  const gov = resolveAccessGovernance(ctx);
  const offline = ctx.connectivity === "OFFLINE";
  const walletLocked = ctx.walletSecurityMode === "locked" || ctx.walletSecurityMode === "offline_wait";
  const walletOwner = ctx.organizationId === ctx.walletOwnerOrganizationId;

  const canViewRelationalCatalog = canSeeResource(ctx, "relational_catalog");
  const canViewOrder = canSeeResource(ctx, "order");
  const canViewDelivery = canViewOrder && canSeeResource(ctx, "delivery");
  const canViewSettlement =
    canSeeResource(ctx, "settlement") && walletOwner;
  const canUseWallet = walletOwner && !walletLocked && !offline;
  const canUseTerrainMessaging =
    canSeeResource(ctx, "messaging") && isTerrainActor(ctx.actorRole);
  const canUseFormalMail =
    canSeeResource(ctx, "mail") && (isFormalActor(ctx.actorRole) || gov?.preferMail === true);
  const canUseOfflineCache = canSeeResource(ctx, "offline_cache");

  return {
    canViewRelationalCatalog,
    canCreateOrder: canViewRelationalCatalog && isRelationshipActive(ctx) && !offline,
    canViewOrder,
    canUpdateOrderStatus: canViewOrder && !offline,
    canViewDelivery,
    canConfirmDelivery: canViewDelivery && !offline,
    canViewSettlement,
    canConfirmSettlement: canViewSettlement && canUseWallet && !offline,
    canUseWallet,
    canUseTerrainMessaging,
    canUseFormalMail,
    canViewNotifications: canSeeResource(ctx, "notifications"),
    canViewActivityFeed: canSeeResource(ctx, "activity_feed"),
    canUseOfflineCache,
    canViewPartnerProfile:
      canSeeResource(ctx, "partner_profile") && Boolean(ctx.partnerOrganizationId ?? ctx.relationshipId),
    canAutoAcceptRelationship: gov?.autoAccept === "auto" || gov?.autoAccept === "contextual",
  };
}

export function canViewRelationalCatalog(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canViewRelationalCatalog;
}

export function canCreateOrder(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canCreateOrder;
}

export function canViewOrder(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canViewOrder;
}

export function canUpdateOrderStatus(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canUpdateOrderStatus;
}

export function canViewDelivery(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canViewDelivery;
}

export function canConfirmDelivery(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canConfirmDelivery;
}

export function canViewSettlement(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canViewSettlement;
}

export function canConfirmSettlement(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canConfirmSettlement;
}

export function canUseWallet(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canUseWallet;
}

export function canUseTerrainMessaging(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canUseTerrainMessaging;
}

export function canUseFormalMail(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canUseFormalMail;
}

export function canViewNotifications(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canViewNotifications;
}

export function canViewActivityFeed(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canViewActivityFeed;
}

export function canUseOfflineCache(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canUseOfflineCache;
}

export function canViewPartnerProfile(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canViewPartnerProfile;
}

export function canAutoAcceptRelationship(ctx: CommerceAccessContext): boolean {
  return evaluateCommercePermissions(ctx).canAutoAcceptRelationship;
}
