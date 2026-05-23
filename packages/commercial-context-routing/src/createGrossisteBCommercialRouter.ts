import type { CommercialActorRole } from "commercial-relationship-governance";

import type { GrossisteBTabDestination } from "./commercial-actor-destinations";
import { buildScreenNavigationPayload } from "./commercial-screen-navigation";
import { createCommercialContextRouter } from "./commercial-context-router";
import type {
  CommercialContextLinkGraph,
  CommercialContextReference,
  CommercialContextRouter,
  CommercialContextRoutingFlags,
} from "./commercial-context-routing.types";

export type GrossisteBNavigationHandlers = {
  setActiveTab: (tab: GrossisteBTabDestination) => void;
  setFocusReference?: (ref: CommercialContextReference) => void;
  onGoBack?: (ref: CommercialContextReference) => void;
};

export function createGrossisteBCommercialRouter(options: {
  flags?: CommercialContextRoutingFlags;
  linkGraph?: CommercialContextLinkGraph;
  navigation: GrossisteBNavigationHandlers;
}): CommercialContextRouter {
  const actor: CommercialActorRole = "grossiste_b";

  const applyPayload = (payload: ReturnType<typeof buildScreenNavigationPayload>) => {
    if (!payload || payload.destination.actor !== "grossiste_b") return;
    options.navigation.setActiveTab(payload.destination.screen);
    options.navigation.setFocusReference?.(payload.reference);
  };

  return createCommercialContextRouter({
    flags: options.flags,
    linkGraph: options.linkGraph,
    onNavigate: (intent) => {
      const payload = buildScreenNavigationPayload(actor, intent, options.flags);
      applyPayload(payload);
    },
  });
}

export function grossisteBTabFromReference(
  ref: CommercialContextReference,
): GrossisteBTabDestination | null {
  if (ref.activeModule === "messaging" || ref.conversationId) return "messaging";
  if (ref.activeModule === "wallet" || ref.settlementId) return "wallet";
  if (ref.activeModule === "order" || ref.orderId) return "orders";
  if (ref.activeModule === "delivery" || ref.deliveryId) return "activity";
  if (ref.activeModule === "catalog" || ref.catalogId || ref.supplierId) return "catalog";
  if (ref.activeModule === "activity" || ref.activityId) return "activity";
  return null;
}
