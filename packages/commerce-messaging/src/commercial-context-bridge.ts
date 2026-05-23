import type { CommercialContextRoutingInput } from "commercial-context-routing";
import { isCommercialContextRoutingEnabled } from "commercial-context-routing";

import type { CommerceLinkedQuickActionId } from "./linked-commerce/commerce-linked-context.types";

export type { CommercialContextRoutingInput };

export function routeLinkedCommerceAction(
  action: CommerceLinkedQuickActionId,
  routing: CommercialContextRoutingInput | undefined,
  ids: { orderId?: string; settlementId?: string },
): void {
  if (!routing?.router || !isCommercialContextRoutingEnabled(routing.flags)) return;
  const handlers = routing.router.messagingHandlers();
  if (action === "view-order" && ids.orderId) {
    handlers.onViewOrder?.(ids.orderId);
  }
  if (action === "view-settlement" && ids.settlementId) {
    handlers.onViewSettlement?.(ids.settlementId);
  }
}
