import {
  isCommercialRelationshipGovernanceEnabled,
  resolveRelationshipGovernance,
} from "commercial-relationship-governance";
import type { ActorPair } from "commercial-relationship-governance";

import { buildAccessContext } from "commerce-access-control";
import { withCatalogAccess, withOfflineCacheAccess } from "commerce-access-control";

import type {
  CommerceOfflineActorRole,
  CommerceOfflineBootstrapPayload,
  CommerceOfflineCacheDomain,
  CommerceOfflineFlags,
  CommerceOfflineQueueActionType,
} from "./commerce-offline.types";

const FORBIDDEN_CACHE: CommerceOfflineCacheDomain[] = [];
const FINANCIAL_WALLET_KEYS = ["payment", "settlement", "transfer", "receive", "payout"];

function actorToGov(role: CommerceOfflineActorRole): ActorPair["self"] {
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

export function isWalletFinancialActionBlocked(
  type: CommerceOfflineQueueActionType,
  payload: Record<string, unknown>,
): boolean {
  if (type !== "WALLET_LIGHT_ACTION") return false;
  const action = String(payload.action ?? "").toLowerCase();
  return FINANCIAL_WALLET_KEYS.some((k) => action.includes(k));
}

export function filterBootstrapForGovernance(
  bootstrap: CommerceOfflineBootstrapPayload,
  flags: CommerceOfflineFlags,
): CommerceOfflineBootstrapPayload {
  const accessCtx = buildAccessContext({
    actorRole: bootstrap.actorRole,
    organizationId: bootstrap.organizationId,
    flags: flags as CommerceOfflineFlags & Record<string, boolean | undefined>,
  });
  if (
    !withOfflineCacheAccess(accessCtx, () => true) ||
    !withCatalogAccess(accessCtx, () => true)
  ) {
    return {
      ...bootstrap,
      relationalCatalog: [],
      recentOrders: [],
      recentDeliveries: [],
    };
  }
  if (!isCommercialRelationshipGovernanceEnabled(flags)) return bootstrap;
  const pair: ActorPair = {
    self: actorToGov(bootstrap.actorRole),
    partner: actorToGov(bootstrap.actorRole),
  };
  const gov = resolveRelationshipGovernance(pair);
  if (gov.catalogMode === "relation-only" || gov.catalogMode === "partner-approved") {
    return bootstrap;
  }
  return { ...bootstrap, relationalCatalog: [] };
}

export function isCacheDomainAllowed(domain: CommerceOfflineCacheDomain): boolean {
  return !FORBIDDEN_CACHE.includes(domain);
}

export function allowedDomainsForActor(role: CommerceOfflineActorRole): CommerceOfflineCacheDomain[] {
  const base: CommerceOfflineCacheDomain[] = [
    "relational_catalog",
    "recent_orders",
    "recent_deliveries",
    "recent_activity",
    "notifications",
    "recent_conversations",
    "commercial_context",
    "user_preferences",
    "i18n",
    "session",
  ];
  if (role === "PRODUCER" || role === "GROSSISTE_A") return base;
  return base;
}
