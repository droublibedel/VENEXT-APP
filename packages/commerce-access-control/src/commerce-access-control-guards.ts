import type {
  CommerceAccessContext,
  CommerceAccessDecision,
  CommerceAccessResource,
  CommercePermissions,
} from "./commerce-access-control.types";
import { decisionFromCode } from "./commerce-access-control-errors";
import {
  isBackendAccessGuardEnabled,
  isCommerceAccessControlEnabled,
  isVisibilityGuardEnabled,
} from "./commerce-access-control-governance";
import { evaluateCommercePermissions } from "./commerce-access-control-permissions";
import { assertNoUrlBypass, canSeeResource } from "./commerce-access-control-visibility";
import {
  evaluateMessagingGuardPriority,
  isParticipantSuspended,
} from "./messaging-access-priority";

const PERMISSION_BY_RESOURCE: Partial<
  Record<CommerceAccessResource, keyof CommercePermissions>
> = {
  relational_catalog: "canViewRelationalCatalog",
  order: "canViewOrder",
  delivery: "canViewDelivery",
  settlement: "canViewSettlement",
  wallet: "canUseWallet",
  messaging: "canUseTerrainMessaging",
  mail: "canUseFormalMail",
  notifications: "canViewNotifications",
  activity_feed: "canViewActivityFeed",
  offline_cache: "canUseOfflineCache",
  partner_profile: "canViewPartnerProfile",
  relationship: "canViewPartnerProfile",
};

export function guardCommerceResource(
  ctx: CommerceAccessContext,
  resource: CommerceAccessResource,
  opts: { requestedOrganizationId?: string; action?: "read" | "write" } = {},
): CommerceAccessDecision {
  if (resource === "messaging" || resource === "mail") {
    const priority = evaluateMessagingGuardPriority(ctx, { route: resource });
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
  } else if (isParticipantSuspended(ctx.participantStatus)) {
    return decisionFromCode("messaging_participant_suspended");
  }

  const flags = ctx.flags ?? {};
  if (!isCommerceAccessControlEnabled(flags)) {
    return { allowed: true };
  }

  if (opts.requestedOrganizationId && !assertNoUrlBypass(ctx, opts.requestedOrganizationId)) {
    return decisionFromCode("partner_only");
  }

  if (!isVisibilityGuardEnabled(flags)) {
    return { allowed: true };
  }

  if (ctx.catalogVisibility === "GLOBAL") {
    return decisionFromCode("global_catalog_forbidden");
  }

  if (
    ctx.relationshipId &&
    (ctx.relationshipStatus === "REMOVED" || ctx.relationshipStatus === "SUSPENDED")
  ) {
    return decisionFromCode("relation_inactive");
  }

  if (ctx.connectivity === "OFFLINE" && opts.action === "write") {
    return decisionFromCode("offline_action_unavailable");
  }

  const perms = evaluateCommercePermissions(ctx);
  const key = PERMISSION_BY_RESOURCE[resource];
  if (key && !perms[key]) {
    switch (resource) {
      case "relational_catalog":
        return decisionFromCode("catalog_unavailable");
      case "order":
      case "delivery":
        return decisionFromCode("order_not_accessible");
      case "settlement":
        return decisionFromCode("settlement_not_allowed");
      case "wallet":
        return decisionFromCode("wallet_not_owner");
      case "messaging":
        return decisionFromCode("messaging_not_allowed");
      case "mail":
        return decisionFromCode("mail_not_allowed");
      default:
        return decisionFromCode("partner_only");
    }
  }

  if (!canSeeResource(ctx, resource)) {
    return decisionFromCode(
      resource === "relational_catalog" ? "catalog_unavailable" : "partner_only",
    );
  }

  return { allowed: true };
}

export function assertCommerceAccess(
  ctx: CommerceAccessContext,
  resource: CommerceAccessResource,
  opts?: { requestedOrganizationId?: string; action?: "read" | "write" },
): void {
  const decision = guardCommerceResource(ctx, resource, opts);
  if (!decision.allowed) {
    throw new Error(decision.userMessage ?? "Action non disponible");
  }
}

export function guardBackendRoute(
  ctx: CommerceAccessContext,
  resource: CommerceAccessResource,
  organizationId: string,
): CommerceAccessDecision {
  if (resource === "messaging" || resource === "mail") {
    const priority = evaluateMessagingGuardPriority(ctx, { route: resource });
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
  }

  if (!isBackendAccessGuardEnabled(ctx.flags ?? {})) {
    return { allowed: true };
  }
  return guardCommerceResource(ctx, resource, {
    requestedOrganizationId: organizationId,
    action: "read",
  });
}
