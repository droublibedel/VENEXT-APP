import type {
  CommercialContextRoutingInput,
  CommercialNavigationIntent,
} from "commercial-context-routing";
import { isCommercialContextRoutingEnabled } from "commercial-context-routing";

export type { CommercialContextRoutingInput };

export function routeWalletToOrder(
  orderId: string,
  routing?: CommercialContextRoutingInput,
): CommercialNavigationIntent | null {
  if (!routing?.router || !isCommercialContextRoutingEnabled(routing.flags)) {
    return null;
  }
  return routing.router.navigate("wallet-to-order", { orderId, settlementId: orderId });
}
