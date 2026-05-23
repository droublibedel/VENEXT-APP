import type { CommercialActorRole } from "commercial-relationship-governance";

import type { DetaillantTabDestination } from "./commercial-actor-destinations";
import { buildScreenNavigationPayload } from "./commercial-screen-navigation";
import { createCommercialContextRouter } from "./commercial-context-router";
import type {
  CommercialContextLinkGraph,
  CommercialContextReference,
  CommercialContextRouter,
  CommercialContextRoutingFlags,
} from "./commercial-context-routing.types";

export type DetaillantNavigationHandlers = {
  setActiveTab: (tab: DetaillantTabDestination) => void;
  setFocusReference?: (ref: CommercialContextReference) => void;
};

export function detaillantTabFromReference(
  ref: CommercialContextReference,
): DetaillantTabDestination | null {
  if (ref.activeModule === "messaging" || ref.conversationId || ref.mailThreadId) return "messaging";
  if (ref.activeModule === "wallet" || ref.settlementId) return "account";
  if (ref.activeModule === "order" || ref.orderId || ref.deliveryId) return "orders";
  if (ref.activeModule === "catalog" || ref.catalogId || ref.supplierId) return "products";
  if (ref.activeModule === "activity" || ref.activityId) return "home";
  return null;
}

export function createDetaillantCommercialRouter(options: {
  flags?: CommercialContextRoutingFlags;
  linkGraph?: CommercialContextLinkGraph;
  navigation: DetaillantNavigationHandlers;
}): CommercialContextRouter {
  const actor: CommercialActorRole = "detaillant";

  return createCommercialContextRouter({
    flags: options.flags,
    linkGraph: options.linkGraph,
    onNavigate: (intent) => {
      const payload = buildScreenNavigationPayload(actor, intent, options.flags);
      if (!payload || payload.destination.actor !== "detaillant") return;
      options.navigation.setActiveTab(payload.destination.screen);
      options.navigation.setFocusReference?.(payload.reference);
    },
  });
}
