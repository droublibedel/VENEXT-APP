/**
 * Ponts légers pour les packages VENEXT — n’altère pas les APIs publiques existantes.
 */
import type { CommerceAccessContext } from "./commerce-access-control.types";
import { isCommerceAccessControlEnabled } from "./commerce-access-control-governance";
import {
  canUseFormalMail,
  canUseOfflineCache,
  canUseTerrainMessaging,
  canUseWallet,
  canViewActivityFeed,
  canViewNotifications,
  canViewOrder,
  canViewRelationalCatalog,
  canCreateOrder,
} from "./commerce-access-control-permissions";
import { guardCommerceResource } from "./commerce-access-control-guards";
import {
  guardCatalogAction,
  guardMessagingAction,
  guardOfflineReplay,
  guardOrderAction,
  guardWalletAction,
  type CatalogAccessAction,
  type MessagingAccessAction,
  type OrderAccessAction,
  type WalletAccessAction,
} from "./commerce-surface-access";

export function withCatalogAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return canViewRelationalCatalog(ctx) && fallback();
}

export function withCatalogActionAccess(
  ctx: CommerceAccessContext,
  action: CatalogAccessAction,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return guardCatalogAction(ctx, action).allowed && fallback();
}

export function withOrderAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return canViewOrder(ctx) && fallback();
}

export function withOrderActionAccess(
  ctx: CommerceAccessContext,
  action: OrderAccessAction,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return guardOrderAction(ctx, action).allowed && fallback();
}

export function withQuickOrderAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return canCreateOrder(ctx) && guardCatalogAction(ctx, "quick_order").allowed && fallback();
}

export function withWalletAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return canUseWallet(ctx) && fallback();
}

export function withWalletActionAccess(
  ctx: CommerceAccessContext,
  action: WalletAccessAction,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return guardWalletAction(ctx, action).allowed && fallback();
}

export function withTerrainMessagingAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return guardMessagingAction(ctx, "terrain").allowed && fallback();
}

export function withFormalMailAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return guardMessagingAction(ctx, "formal").allowed && fallback();
}

export function withMessagingParticipantAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return guardMessagingAction(ctx, "participant").allowed && fallback();
}

export function withNotificationsAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return canViewNotifications(ctx) && fallback();
}

export function withActivityFeedAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return canViewActivityFeed(ctx) && fallback();
}

export function withOfflineCacheAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return canUseOfflineCache(ctx) && fallback();
}

export function withOfflineReplayAccess(
  ctx: CommerceAccessContext,
  fallback: () => boolean,
): boolean {
  if (!isCommerceAccessControlEnabled(ctx.flags)) return fallback();
  return guardOfflineReplay(ctx).allowed && fallback();
}

export function backendGuardOrAllow(
  ctx: CommerceAccessContext,
  resource: Parameters<typeof guardCommerceResource>[1],
  organizationId: string,
): { allowed: boolean; message?: string } {
  const d = guardCommerceResource(ctx, resource, { requestedOrganizationId: organizationId });
  return { allowed: d.allowed, message: d.userMessage };
}
