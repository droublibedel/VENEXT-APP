import type { CommerceAccessContext, CommerceAccessDecision } from "./commerce-access-control.types";
import { decisionFromCode } from "./commerce-access-control-errors";
import {
  assertCommerceAccess,
  guardCommerceResource,
} from "./commerce-access-control-guards";
import {
  canCreateOrder,
  canUseFormalMail,
  canUseTerrainMessaging,
  canUseWallet,
  canViewOrder,
  canViewRelationalCatalog,
  evaluateCommercePermissions,
} from "./commerce-access-control-permissions";
import { isRelationshipActive } from "./commerce-access-control-governance";
import { isCommerceAccessControlEnabled } from "./commerce-access-control-governance";
import { evaluateMessagingGuardPriority } from "./messaging-access-priority";

export type CatalogAccessAction =
  | "view"
  | "browse"
  | "quick_order"
  | "visibility"
  | "hidden"
  | "sponsored"
  | "partner_only";

export type OrderAccessAction = "create" | "read" | "track" | "delivery" | "settlement";

export type WalletAccessAction = "access" | "settlement" | "history" | "activation" | "secured";

export type MessagingAccessAction = "terrain" | "formal" | "participant";

export function guardCatalogAction(
  ctx: CommerceAccessContext,
  action: CatalogAccessAction,
  opts: { requestedOrganizationId?: string } = {},
): CommerceAccessDecision {
  if (!isCommerceAccessControlEnabled(ctx.flags)) {
    return { allowed: true };
  }

  if (action === "hidden" || ctx.catalogVisibility === "HIDDEN") {
    return decisionFromCode("catalog_unavailable");
  }

  if (action === "sponsored" && ctx.catalogVisibility !== "SPONSORED") {
    return decisionFromCode("catalog_unavailable");
  }

  if (action === "partner_only" && !ctx.relationshipId) {
    return decisionFromCode("partner_only");
  }

  const write = action === "quick_order";
  const base = guardCommerceResource(ctx, "relational_catalog", {
    requestedOrganizationId: opts.requestedOrganizationId,
    action: write ? "write" : "read",
  });
  if (!base.allowed) return base;

  if (write && !canCreateOrder(ctx)) {
    return decisionFromCode("catalog_unavailable");
  }

  if ((action === "view" || action === "browse") && !canViewRelationalCatalog(ctx)) {
    return decisionFromCode("catalog_unavailable");
  }

  return { allowed: true };
}

export function guardOrderAction(
  ctx: CommerceAccessContext,
  action: OrderAccessAction,
  opts: { requestedOrganizationId?: string } = {},
): CommerceAccessDecision {
  if (!isCommerceAccessControlEnabled(ctx.flags)) {
    return { allowed: true };
  }

  const resource =
    action === "delivery" ? "delivery" : action === "settlement" ? "settlement" : "order";
  const write = action === "create";

  const base = guardCommerceResource(ctx, resource, {
    requestedOrganizationId: opts.requestedOrganizationId,
    action: write ? "write" : "read",
  });
  if (!base.allowed) return base;

  if (!canViewOrder(ctx) && action !== "create") {
    return decisionFromCode("order_not_accessible");
  }

  if (write && !canCreateOrder(ctx)) {
    return decisionFromCode("order_not_accessible");
  }

  return { allowed: true };
}

export function guardWalletAction(
  ctx: CommerceAccessContext,
  action: WalletAccessAction,
): CommerceAccessDecision {
  if (!isCommerceAccessControlEnabled(ctx.flags)) {
    return { allowed: true };
  }

  if (ctx.organizationId !== ctx.walletOwnerOrganizationId) {
    return decisionFromCode("wallet_not_owner");
  }

  if (!isRelationshipActive(ctx) && action !== "history") {
    return decisionFromCode("relation_inactive");
  }

  if (ctx.connectivity === "OFFLINE" && action !== "history") {
    return decisionFromCode("offline_action_unavailable");
  }

  if (ctx.walletSecurityMode === "locked" && (action === "settlement" || action === "secured")) {
    return decisionFromCode("settlement_not_allowed");
  }

  const resource = action === "settlement" ? "settlement" : "wallet";
  const base = guardCommerceResource(ctx, resource, { action: action === "history" ? "read" : "write" });
  if (!base.allowed) return base;

  if (!canUseWallet(ctx) && action !== "history") {
    return decisionFromCode("wallet_not_owner");
  }

  return { allowed: true };
}

export function guardMessagingAction(
  ctx: CommerceAccessContext,
  action: MessagingAccessAction,
): CommerceAccessDecision {
  const priority = evaluateMessagingGuardPriority(ctx, { route: `messaging:${action}` });
  if (!priority.allowed) {
    return {
      allowed: false,
      errorCode:
        priority.reason === "participant_suspended"
          ? "messaging_participant_suspended"
          : "messaging_not_allowed",
      userMessage: priority.userMessage,
    };
  }

  if (!isCommerceAccessControlEnabled(ctx.flags)) {
    return { allowed: true };
  }

  if (!isRelationshipActive(ctx)) {
    return decisionFromCode("relation_inactive");
  }

  if (action === "terrain") {
    const d = guardCommerceResource(ctx, "messaging", { action: "read" });
    if (!d.allowed) return d;
    return canUseTerrainMessaging(ctx)
      ? { allowed: true }
      : decisionFromCode("messaging_not_allowed");
  }

  if (action === "formal") {
    const d = guardCommerceResource(ctx, "mail", { action: "read" });
    if (!d.allowed) return d;
    return canUseFormalMail(ctx) ? { allowed: true } : decisionFromCode("mail_not_allowed");
  }

  return guardCommerceResource(ctx, "messaging", { action: "read" });
}

export function guardOfflineReplay(ctx: CommerceAccessContext): CommerceAccessDecision {
  if (!isCommerceAccessControlEnabled(ctx.flags)) {
    return { allowed: true };
  }
  if (ctx.relationshipStatus === "SUSPENDED" || ctx.relationshipStatus === "REMOVED") {
    return decisionFromCode("relation_inactive");
  }
  return guardCommerceResource(ctx, "offline_cache", { action: "write" });
}

export function assertCatalogAction(
  ctx: CommerceAccessContext,
  action: CatalogAccessAction,
  opts?: { requestedOrganizationId?: string },
): void {
  const d = guardCatalogAction(ctx, action, opts);
  if (!d.allowed) throw new Error(d.userMessage ?? "Catalogue non disponible");
}

export function assertOrderAction(
  ctx: CommerceAccessContext,
  action: OrderAccessAction,
  opts?: { requestedOrganizationId?: string },
): void {
  const d = guardOrderAction(ctx, action, opts);
  if (!d.allowed) throw new Error(d.userMessage ?? "Commande non accessible");
}

export function assertWalletAction(ctx: CommerceAccessContext, action: WalletAccessAction): void {
  const d = guardWalletAction(ctx, action);
  if (!d.allowed) throw new Error(d.userMessage ?? "Règlements disponibles sur votre espace uniquement");
}

export function assertMessagingAction(ctx: CommerceAccessContext, action: MessagingAccessAction): void {
  const d = guardMessagingAction(ctx, action);
  if (!d.allowed) throw new Error(d.userMessage ?? "Messagerie non disponible dans ce contexte");
}

export function assertOfflineReplay(ctx: CommerceAccessContext): void {
  const d = guardOfflineReplay(ctx);
  if (!d.allowed) throw new Error(d.userMessage ?? "Action indisponible hors connexion");
}

export function evaluateSurfacePermissions(ctx: CommerceAccessContext) {
  return evaluateCommercePermissions(ctx);
}

export function assertSurfaceCommerceAccess(
  ctx: CommerceAccessContext,
  resource: Parameters<typeof assertCommerceAccess>[1],
  opts?: Parameters<typeof assertCommerceAccess>[2],
): void {
  assertCommerceAccess(ctx, resource, opts);
}
