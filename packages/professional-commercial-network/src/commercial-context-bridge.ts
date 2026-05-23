import type { CommercialContextRoutingInput } from "commercial-context-routing";
import { isCommercialContextRoutingEnabled } from "commercial-context-routing";

import type { ProfessionalNetworkInjected } from "./professional-commercial-network.types";

export type { CommercialContextRoutingInput };

export type ProfessionalNetworkMailCallbacks = Pick<
  ProfessionalNetworkInjected,
  "onOpenMail" | "onOpenMessaging"
>;

export function bindProfessionalNetworkContextRouting(
  props: ProfessionalNetworkMailCallbacks,
  routing?: CommercialContextRoutingInput,
): ProfessionalNetworkMailCallbacks {
  if (!routing?.router || !isCommercialContextRoutingEnabled(routing.flags)) {
    return props;
  }
  const router = routing.router;
  return {
    onOpenMail: (threadId: string) => {
      router.navigate("order-to-mail", { mailThreadId: threadId });
      props.onOpenMail?.(threadId);
    },
    onOpenMessaging: (partnerId: string) => {
      router.navigate("order-to-messaging", { partnerId, conversationId: `conv-${partnerId}` });
      props.onOpenMessaging?.(partnerId);
    },
  };
}
