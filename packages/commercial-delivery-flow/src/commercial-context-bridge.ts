import {
  mergeWithContextRouter,
  type CommercialContextRoutingInput,
} from "commercial-context-routing";

import type { CommercialDeliveryFlowShellProps } from "./commercial-delivery-flow.types";

export type { CommercialContextRoutingInput };

type DeliveryCallbacks = Pick<
  CommercialDeliveryFlowShellProps,
  | "onOpenConversation"
  | "onOpenMail"
  | "onOpenWallet"
  | "onOpenOrder"
  | "onOpenActivity"
  | "onQuickAction"
>;

export function bindDeliveryContextRouting<T extends DeliveryCallbacks>(
  props: T,
  routing?: CommercialContextRoutingInput,
): T {
  if (!routing?.router) return props;
  return mergeWithContextRouter(props, routing.router, "deliveryShellHandlers");
}
