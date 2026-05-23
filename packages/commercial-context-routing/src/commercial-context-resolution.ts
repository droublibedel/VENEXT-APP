import { sanitizeCommerceFoundationText } from "commerce-foundation-guardrails";

import { setActiveCommercialContext } from "./commercial-context-routing";
import type {
  CommercialContextLinkGraph,
  CommercialContextModule,
  CommercialContextReference,
  CommercialContextStore,
} from "./commercial-context-routing.types";

const FORBIDDEN_NAV = /\b(erp|wizard|workflow engine|supply chain portal|enterprise dashboard)\b/i;

export function sanitizeCommercialNavigationLabel(label: string): string {
  if (FORBIDDEN_NAV.test(label)) {
    return "Continuer l'activité commerciale";
  }
  return sanitizeCommerceFoundationText(label);
}

function mergeRef(
  base: CommercialContextReference,
  patch: Partial<CommercialContextReference>,
): CommercialContextReference {
  return { ...base, ...patch };
}

function lookupGraph(
  graph: CommercialContextLinkGraph | undefined,
  ref: CommercialContextReference,
): Partial<CommercialContextReference> {
  if (!graph) return {};
  if (ref.orderId && graph.byOrderId?.[ref.orderId]) {
    return graph.byOrderId[ref.orderId]!;
  }
  if (ref.deliveryId && graph.byDeliveryId?.[ref.deliveryId]) {
    return graph.byDeliveryId[ref.deliveryId]!;
  }
  if (ref.conversationId && graph.byConversationId?.[ref.conversationId]) {
    return graph.byConversationId[ref.conversationId]!;
  }
  if (ref.mailThreadId && graph.byMailThreadId?.[ref.mailThreadId]) {
    return graph.byMailThreadId[ref.mailThreadId]!;
  }
  if (ref.settlementId && graph.bySettlementId?.[ref.settlementId]) {
    return graph.bySettlementId[ref.settlementId]!;
  }
  if (ref.catalogId && graph.byCatalogId?.[ref.catalogId]) {
    return graph.byCatalogId[ref.catalogId]!;
  }
  return {};
}

export type ResolvedCommercialContext = {
  reference: CommercialContextReference;
  primaryModule: CommercialContextModule | null;
  linked: Partial<CommercialContextReference>;
  panelHint?: string;
};

export function resolveCommercialContext(
  partial: Partial<CommercialContextReference>,
  options: {
    store?: CommercialContextStore;
    linkGraph?: CommercialContextLinkGraph;
    persist?: boolean;
  } = {},
): ResolvedCommercialContext {
  const base = options.store?.active ?? {};
  const merged = mergeRef(base, partial);
  const linked = lookupGraph(options.linkGraph, merged);
  const reference = mergeRef(merged, linked);

  if (options.persist !== false && options.store) {
    setActiveCommercialContext(options.store, reference);
  }

  const primaryModule =
    reference.activeModule ??
    (reference.orderId
      ? "order"
      : reference.deliveryId
        ? "delivery"
        : reference.conversationId
          ? "messaging"
          : reference.mailThreadId
            ? "mail"
            : reference.settlementId
              ? "wallet"
              : reference.catalogId
                ? "catalog"
                : reference.activityId
                  ? "activity"
                  : null);

  const panelHint = reference.orderId
    ? sanitizeCommercialNavigationLabel("Panneau commande actif")
    : reference.deliveryId
      ? sanitizeCommercialNavigationLabel("Panneau livraison actif")
      : undefined;

  return {
    reference: { ...reference, activeModule: primaryModule ?? reference.activeModule },
    primaryModule,
    linked,
    panelHint,
  };
}

export function resolvePanelForModule(module: CommercialContextModule): string {
  switch (module) {
    case "order":
      return "status";
    case "delivery":
      return "status";
    case "wallet":
      return "transactions";
    case "messaging":
      return "thread";
    case "mail":
      return "thread";
    case "catalog":
      return "catalog";
    case "activity":
      return "activity";
    default:
      return "status";
  }
}
