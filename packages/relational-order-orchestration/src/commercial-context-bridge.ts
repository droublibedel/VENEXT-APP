import {
  mergeWithContextRouter,
  type CommercialContextRoutingInput,
} from "commercial-context-routing";

import type { RelationalOrderOrchestrationCallbacks } from "./relational-order-orchestration.types";

export type { CommercialContextRoutingInput };

export function bindOrderOrchestrationContextRouting<
  T extends RelationalOrderOrchestrationCallbacks,
>(props: T, routing?: CommercialContextRoutingInput): T {
  if (!routing?.router) return props;
  return mergeWithContextRouter(props, routing.router, "orderShellHandlers");
}
