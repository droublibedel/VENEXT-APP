import type { CommercialActorRole } from "commercial-relationship-governance";

import type {
  ProducerPoleDestination,
  ProducerWorkspaceTabDestination,
} from "./commercial-actor-destinations";
import { buildScreenNavigationPayload } from "./commercial-screen-navigation";
import { createCommercialContextRouter } from "./commercial-context-router";
import type {
  CommercialContextLinkGraph,
  CommercialContextReference,
  CommercialContextRouter,
  CommercialContextRoutingFlags,
} from "./commercial-context-routing.types";

export type ProducerNavigationHandlers = {
  setActivePole: (pole: ProducerPoleDestination) => void;
  setRelationalTab?: (tab: ProducerWorkspaceTabDestination) => void;
  setFocusReference?: (ref: CommercialContextReference) => void;
};

export function producerPoleFromReference(
  ref: CommercialContextReference,
): ProducerPoleDestination | null {
  if (ref.activeModule === "mail" || ref.mailThreadId) return "producer-commercial-mail-workspace";
  if (ref.activeModule === "messaging" || ref.conversationId)
    return "professional-commercial-network-workspace";
  if (ref.activeModule === "wallet" || ref.settlementId) return "finance-collections-workspace";
  if (ref.activeModule === "delivery" || ref.deliveryId) return "order-fulfillment";
  if (ref.activeModule === "catalog" || ref.catalogId || ref.supplierId) return "catalog-products";
  if (ref.activeModule === "order" || ref.orderId || ref.activeModule === "activity" || ref.activityId) {
    return "relational-commercial";
  }
  return null;
}

export function producerSubTabFromReference(
  ref: CommercialContextReference,
): ProducerWorkspaceTabDestination | null {
  if (ref.orderId || ref.activeModule === "order") return "orders";
  if (ref.activityId || ref.activeModule === "activity") return "activity";
  if (ref.catalogId || ref.supplierId || ref.activeModule === "catalog") return "products";
  return null;
}

export function createProducerCommercialRouter(options: {
  flags?: CommercialContextRoutingFlags;
  linkGraph?: CommercialContextLinkGraph;
  navigation: ProducerNavigationHandlers;
}): CommercialContextRouter {
  const actor: CommercialActorRole = "producteur";

  return createCommercialContextRouter({
    flags: options.flags,
    linkGraph: options.linkGraph,
    onNavigate: (intent) => {
      const payload = buildScreenNavigationPayload(actor, intent, options.flags);
      if (!payload || payload.destination.actor !== "producteur") return;
      options.navigation.setActivePole(payload.destination.screen);
      if (payload.destination.subTab) {
        options.navigation.setRelationalTab?.(payload.destination.subTab);
      }
      options.navigation.setFocusReference?.(payload.reference);
    },
  });
}
