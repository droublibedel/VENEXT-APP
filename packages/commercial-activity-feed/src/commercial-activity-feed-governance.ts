import {
  isCommercialRelationshipGovernanceEnabled,
  resolveRelationshipGovernance,
} from "commercial-relationship-governance";
import type { ActorPair } from "commercial-relationship-governance";

import { buildAccessContext, mergeAccessContext, withActivityFeedAccess } from "commerce-access-control";

import type {
  CommercialActivityActorRole,
  CommercialActivityFeedFlags,
  CommercialActivityFilter,
  CommercialActivityItem,
} from "./commercial-activity-feed.types";
import { COMMERCIAL_ACTIVITY_MAX_HISTORY_DAYS } from "./commercial-activity-feed.types";

const PRODUCER_EVENTS = new Set([
  "NETWORK_ACTIVITY",
  "MAIL_SENT",
  "DELIVERY_CONFIRMED",
  "DELIVERY_STARTED",
  "SETTLEMENT_RECEIVED",
  "ORDER_CONFIRMED",
  "ORDER_COMPLETED",
  "RELATION_ESTABLISHED",
  "NEW_RELATIONAL_CATALOG",
  "PARTNER_ACTIVITY",
]);

const GROSSISTE_A_EVENTS = new Set([
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "ORDER_COMPLETED",
  "DELIVERY_STARTED",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_RECEIVED",
  "RELATION_ESTABLISHED",
  "NEW_RELATIONAL_CATALOG",
  "MAIL_SENT",
  "PARTNER_ACTIVITY",
  "NETWORK_ACTIVITY",
]);

const GROSSISTE_B_EVENTS = new Set([
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "DELIVERY_STARTED",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_RECEIVED",
  "MESSAGE_ACTIVITY",
  "NEW_RELATIONAL_CATALOG",
  "RELATION_ESTABLISHED",
  "WALLET_ACTIVATED",
  "WALLET_SECURED",
]);

const DETAILLANT_EVENTS = new Set([
  "ORDER_CREATED",
  "ORDER_CONFIRMED",
  "DELIVERY_STARTED",
  "DELIVERY_CONFIRMED",
  "SETTLEMENT_RECEIVED",
  "MESSAGE_ACTIVITY",
  "NEW_RELATIONAL_CATALOG",
]);

function actorRoleToGovernanceRole(role: CommercialActivityActorRole): ActorPair["self"] {
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

export function allowedEventsForActor(role: CommercialActivityActorRole): Set<string> {
  switch (role) {
    case "PRODUCER":
      return PRODUCER_EVENTS;
    case "GROSSISTE_A":
      return GROSSISTE_A_EVENTS;
    case "GROSSISTE_B":
      return GROSSISTE_B_EVENTS;
    case "DETAILLANT":
      return DETAILLANT_EVENTS;
  }
}

export function isActivityVisibleForRelationship(
  item: CommercialActivityItem,
  viewerRole: CommercialActivityActorRole,
  flags: CommercialActivityFeedFlags,
): boolean {
  if (!isCommercialRelationshipGovernanceEnabled(flags)) return true;
  if (!item.relationshipId) return item.category === "network" || item.category === "wallet";
  const pair: ActorPair = {
    self: actorRoleToGovernanceRole(viewerRole),
    partner: actorRoleToGovernanceRole(viewerRole),
  };
  const gov = resolveRelationshipGovernance(pair);
  return gov.catalogMode === "relation-only" || gov.catalogMode === "partner-approved";
}

export function filterActivitiesForViewer(
  items: CommercialActivityItem[],
  viewerRole: CommercialActivityActorRole,
  organizationId: string,
  filter: CommercialActivityFilter,
  flags: CommercialActivityFeedFlags,
): CommercialActivityItem[] {
  const allowed = allowedEventsForActor(viewerRole);
  const cutoff = Date.now() - COMMERCIAL_ACTIVITY_MAX_HISTORY_DAYS * 86_400_000;

  const accessCtx = buildAccessContext({
    actorRole: viewerRole,
    organizationId,
    relationshipId: items[0]?.relationshipId,
    flags: flags as CommercialActivityFeedFlags & Record<string, boolean | undefined>,
  });

  return items.filter((item) => {
    if (
      !withActivityFeedAccess(
        mergeAccessContext(accessCtx, {
          relationshipId: item.relationshipId,
          partnerOrganizationId: item.partnerId,
        }),
        () => true,
      )
    ) {
      return false;
    }
    if (item.organizationId !== organizationId && item.actorRole !== viewerRole) return false;
    if (!allowed.has(item.eventType)) return false;
    if (new Date(item.occurredAt).getTime() < cutoff) return false;
    if (!isActivityVisibleForRelationship(item, viewerRole, flags)) return false;
    if (filter !== "all" && item.category !== filter) return false;
    if (item.eventType === "SPONSORED_PRODUCT_VISIBLE" && item.meta?.sponsored === "hidden") return false;
    return true;
  });
}

export function isPartnerOnlyActivity(item: CommercialActivityItem): boolean {
  return Boolean(item.relationshipId || item.partnerId);
}
