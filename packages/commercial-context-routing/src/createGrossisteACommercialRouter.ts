import type { CommercialActorRole } from "commercial-relationship-governance";

import type { GrossisteAWorkspaceDestination } from "./commercial-actor-destinations";
import { buildScreenNavigationPayload } from "./commercial-screen-navigation";
import { createCommercialContextRouter } from "./commercial-context-router";
import type {
  CommercialContextLinkGraph,
  CommercialContextReference,
  CommercialContextRouter,
  CommercialContextRoutingFlags,
} from "./commercial-context-routing.types";

export type GrossisteANavigationHandlers = {
  setActiveWorkspace: (workspace: GrossisteAWorkspaceDestination) => void;
  setFocusReference?: (ref: CommercialContextReference) => void;
};

export function grossisteAWorkspaceFromReference(
  ref: CommercialContextReference,
): GrossisteAWorkspaceDestination | null {
  if (ref.activeModule === "mail" || ref.mailThreadId) return "network";
  if (ref.activeModule === "messaging" || ref.conversationId) return "commerce-messaging";
  if (ref.activeModule === "wallet" || ref.settlementId) return "commerce-wallet";
  if (ref.activeModule === "order" || ref.orderId) return "orders";
  if (ref.activeModule === "delivery" || ref.deliveryId) return "distribution";
  if (ref.activeModule === "catalog" || ref.catalogId || ref.supplierId) return "catalog";
  if (ref.activeModule === "activity" || ref.activityId) return "territory";
  return null;
}

export function createGrossisteACommercialRouter(options: {
  flags?: CommercialContextRoutingFlags;
  linkGraph?: CommercialContextLinkGraph;
  navigation: GrossisteANavigationHandlers;
}): CommercialContextRouter {
  const actor: CommercialActorRole = "grossiste_a";

  return createCommercialContextRouter({
    flags: options.flags,
    linkGraph: options.linkGraph,
    onNavigate: (intent) => {
      const payload = buildScreenNavigationPayload(actor, intent, options.flags);
      if (!payload || payload.destination.actor !== "grossiste_a") return;
      options.navigation.setActiveWorkspace(payload.destination.screen);
      options.navigation.setFocusReference?.(payload.reference);
    },
  });
}
