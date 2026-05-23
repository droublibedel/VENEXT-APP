import {
  assertSingleActivePanel,
  buildCommerceNavigationConsistency,
  isCommerceNavigationConsistencyEnabled,
  mergeCommerceNavigationContext,
} from "commerce-foundation-guardrails";

import {
  isCommercialContextRoutingEnabled,
  isCrossModuleNavigationEnabled,
  setActiveCommercialContext,
} from "./commercial-context-routing";
import { resolveCommercialContext, sanitizeCommercialNavigationLabel } from "./commercial-context-resolution";
import type {
  CommercialContextModule,
  CommercialContextReference,
  CommercialContextRoutingFlags,
  CommercialContextStore,
  CommercialContextTransitionId,
  CommercialNavigationIntent,
} from "./commercial-context-routing.types";

type TransitionDef = {
  target: CommercialContextModule;
  label: string;
  inline: boolean;
  patch?: (ref: CommercialContextReference) => Partial<CommercialContextReference>;
};

const TRANSITIONS: Record<CommercialContextTransitionId, TransitionDef> = {
  "catalog-to-order": {
    target: "order",
    label: "Commande depuis le catalogue",
    inline: true,
    patch: (r) => ({
      activeModule: "order",
      orderId: r.orderId ?? `ord-from-${r.supplierId ?? r.catalogId ?? "catalog"}`,
    }),
  },
  "order-to-delivery": {
    target: "delivery",
    label: "Livraison liée",
    inline: true,
    patch: (r) => ({
      activeModule: "delivery",
      deliveryId: r.deliveryId ?? `del-for-${r.orderId ?? "order"}`,
    }),
  },
  "order-to-messaging": {
    target: "messaging",
    label: "Conversation partenaire",
    inline: true,
    patch: (r) => ({ activeModule: "messaging", conversationId: r.conversationId }),
  },
  "order-to-mail": {
    target: "mail",
    label: "Fil mail professionnel",
    inline: true,
    patch: (r) => ({ activeModule: "mail", mailThreadId: r.mailThreadId }),
  },
  "order-to-wallet": {
    target: "wallet",
    label: "Règlement partenaire",
    inline: true,
    patch: (r) => ({
      activeModule: "wallet",
      settlementId: r.settlementId ?? r.orderId,
    }),
  },
  "delivery-to-reception": {
    target: "delivery",
    label: "Confirmation réception",
    inline: true,
    patch: (r) => ({ activeModule: "delivery", deliveryId: r.deliveryId }),
  },
  "wallet-to-activity": {
    target: "activity",
    label: "Activité commerciale",
    inline: true,
    patch: (r) => ({
      activeModule: "activity",
      activityId: r.activityId ?? `act-${r.settlementId ?? "stl"}`,
    }),
  },
  "messaging-to-order": {
    target: "order",
    label: "Commande liée",
    inline: true,
    patch: (r) => ({ activeModule: "order", orderId: r.orderId }),
  },
  "mail-to-order": {
    target: "order",
    label: "Commande liée au mail",
    inline: true,
    patch: (r) => ({ activeModule: "order", orderId: r.orderId }),
  },
  "wallet-to-order": {
    target: "order",
    label: "Commande liée au règlement",
    inline: true,
    patch: (r) => ({ activeModule: "order", orderId: r.orderId }),
  },
  "order-to-activity": {
    target: "activity",
    label: "Activité liée",
    inline: true,
    patch: (r) => ({ activeModule: "activity", activityId: r.activityId }),
  },
  "delivery-to-order": {
    target: "order",
    label: "Commande liée à la livraison",
    inline: true,
    patch: (r) => ({ activeModule: "order", orderId: r.orderId }),
  },
  "context-back": {
    target: "order",
    label: "Retour au flux précédent",
    inline: true,
  },
};

export function getTransitionTargetModule(
  transition: CommercialContextTransitionId,
): CommercialContextModule {
  return TRANSITIONS[transition].target;
}

export function navigateCommercialContext(
  transition: CommercialContextTransitionId,
  partial: Partial<CommercialContextReference>,
  options: {
    store: CommercialContextStore;
    flags?: CommercialContextRoutingFlags;
    linkGraph?: import("./commercial-context-routing.types").CommercialContextLinkGraph;
  },
): CommercialNavigationIntent | null {
  if (!isCommercialContextRoutingEnabled(options.flags)) return null;
  if (!isCrossModuleNavigationEnabled(options.flags) && transition !== "context-back") {
    return null;
  }

  const def = TRANSITIONS[transition];
  const resolved = resolveCommercialContext(partial, {
    store: options.store,
    linkGraph: options.linkGraph,
    persist: false,
  });

  const patch = def.patch?.(resolved.reference) ?? partial;
  const reference = resolveCommercialContext(patch, {
    store: options.store,
    linkGraph: options.linkGraph,
    persist: true,
  }).reference;

  if (isCommerceNavigationConsistencyEnabled()) {
    const nav = buildCommerceNavigationConsistency(
      mergeCommerceNavigationContext(reference.activeModule ?? def.target),
    );
    assertSingleActivePanel([nav.ok ? (reference.activeModule ?? def.target) : ""]);
    void nav;
  }

  const label = sanitizeCommercialNavigationLabel(def.label);

  return {
    target: def.target,
    transition,
    reference,
    label,
    inline: def.inline,
  };
}

export function assertNavigationNotEnterprise(intent: CommercialNavigationIntent): boolean {
  const blob = `${intent.label} ${intent.transition}`;
  return !/\b(wizard|erp|enterprise suite|admin tunnel)\b/i.test(blob);
}
