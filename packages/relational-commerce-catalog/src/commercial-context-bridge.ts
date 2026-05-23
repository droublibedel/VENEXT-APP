import {
  mergeWithContextRouter,
  type CommercialContextRoutingInput,
} from "commercial-context-routing";

import type { RelationalCatalogShellProps } from "./relational-commerce-catalog.types";

export type { CommercialContextRoutingInput };

type CatalogCallbacks = Pick<
  RelationalCatalogShellProps,
  "onQuickOrder" | "onDiscuss" | "onMail"
>;

export function bindCatalogContextRouting<T extends CatalogCallbacks>(
  props: T,
  routing?: CommercialContextRoutingInput,
): T {
  if (!routing?.router) return props;
  return mergeWithContextRouter(props, routing.router, "catalogShellHandlers");
}
