import {
  createCommercialContextRouter,
  type CommercialContextLinkGraph,
  type CommercialContextRoutingInput,
  type CommercialNavigationIntent,
} from "commercial-context-routing";

export type ProducerMailContextRoutingOptions = {
  flags?: CommercialContextRoutingInput["flags"];
  linkGraph?: CommercialContextLinkGraph;
  onNavigate?: (intent: CommercialNavigationIntent) => void;
};

export function createProducerMailContextRouter(
  options: ProducerMailContextRoutingOptions = {},
): CommercialContextRoutingInput["router"] {
  return createCommercialContextRouter({
    flags: options.flags,
    linkGraph: options.linkGraph,
    onNavigate: options.onNavigate,
    initial: { activeModule: "mail" },
  });
}

export function routeMailThreadToOrder(
  router: CommercialContextRoutingInput["router"],
  mailThreadId: string,
  orderId?: string,
): void {
  router?.navigate("mail-to-order", { mailThreadId, orderId });
}
