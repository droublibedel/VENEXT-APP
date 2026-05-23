import { navigateCommercialContext } from "./commercial-context-navigation";
import { pushCommercialContextHistory } from "./commercial-context-history";
import {
  createCommercialContextStore,
  isCommercialContextRoutingEnabled,
} from "./commercial-context-routing";
import { resolveCommercialContext } from "./commercial-context-resolution";
import type {
  CommercialContextLinkGraph,
  CommercialContextReference,
  CommercialContextRoutingFlags,
  CommercialContextRouter,
  CommercialContextTransitionId,
  CommercialNavigationIntent,
} from "./commercial-context-routing.types";

export function createCommercialContextRouter(options: {
  flags?: CommercialContextRoutingFlags;
  linkGraph?: CommercialContextLinkGraph;
  onNavigate?: (intent: CommercialNavigationIntent) => void;
  initial?: CommercialContextReference;
}): CommercialContextRouter {
  const flags = options.flags ?? {};
  const store = createCommercialContextStore(options.initial ?? {});

  const navigate = (
    transition: CommercialContextTransitionId,
    partial: Partial<CommercialContextReference> = {},
  ): CommercialNavigationIntent | null => {
    if (!isCommercialContextRoutingEnabled(flags)) return null;

    const intent = navigateCommercialContext(transition, partial, {
      store,
      flags,
      linkGraph: options.linkGraph,
    });

    if (intent) {
      pushCommercialContextHistory(
        store,
        { module: intent.target, reference: intent.reference, label: intent.label },
        flags,
      );
      options.onNavigate?.(intent);
    }

    return intent;
  };

  const goBack = (): CommercialContextReference | null => {
    if (store.history.length < 2) return null;
    const [, prev] = store.history;
    if (!prev) return null;
    store.active = { ...prev.reference };
    store.history = store.history.slice(1);
    return store.active;
  };

  return {
    store,
    flags,
    navigate,
    goBack,
    orderShellHandlers: () => ({
      onOpenConversation: (conversationId) => {
        resolveCommercialContext({ conversationId }, { store, linkGraph: options.linkGraph });
        navigate("order-to-messaging", { conversationId });
      },
      onOpenMail: (mailThreadId) => {
        resolveCommercialContext({ mailThreadId }, { store, linkGraph: options.linkGraph });
        navigate("order-to-mail", { mailThreadId });
      },
      onOpenWallet: (settlementId) => {
        resolveCommercialContext({ settlementId }, { store, linkGraph: options.linkGraph });
        navigate("order-to-wallet", { settlementId });
      },
      onOpenActivity: (activityId) => {
        resolveCommercialContext({ activityId }, { store, linkGraph: options.linkGraph });
        navigate("order-to-activity", { activityId });
      },
      onQuickAction: (actionId, orderId) => {
        resolveCommercialContext({ orderId }, { store, linkGraph: options.linkGraph });
        if (actionId === "mark-shipped" || actionId === "confirm-delivery") {
          navigate("order-to-delivery", { orderId });
        }
      },
    }),
    deliveryShellHandlers: () => ({
      onOpenConversation: (conversationId) => {
        navigate("order-to-messaging", { conversationId });
      },
      onOpenMail: (mailThreadId) => {
        navigate("order-to-mail", { mailThreadId });
      },
      onOpenWallet: (settlementId) => {
        navigate("order-to-wallet", { settlementId });
      },
      onOpenOrder: (orderId) => {
        navigate("delivery-to-order", { orderId });
      },
      onOpenActivity: (activityId) => {
        navigate("wallet-to-activity", { activityId });
      },
    }),
    catalogShellHandlers: () => ({
      onQuickOrder: (supplierId, productId) => {
        navigate("catalog-to-order", { supplierId, productId, catalogId: supplierId });
      },
      onDiscuss: (supplierId, productId) => {
        navigate("order-to-messaging", {
          supplierId,
          productId,
          conversationId: `conv-${supplierId}`,
        });
      },
      onMail: (supplierId) => {
        navigate("order-to-mail", { supplierId, mailThreadId: `mail-${supplierId}` });
      },
    }),
    messagingHandlers: () => ({
      onViewOrder: (orderId) => {
        navigate("messaging-to-order", { orderId });
      },
      onViewSettlement: (settlementId) => {
        navigate("wallet-to-order", { settlementId, orderId: settlementId.replace(/^stl-/, "ord-") });
      },
    }),
  };
}

type RouterHandlerKey =
  | "orderShellHandlers"
  | "deliveryShellHandlers"
  | "catalogShellHandlers"
  | "messagingHandlers";

export function mergeWithContextRouter<T extends Record<string, unknown>>(
  props: T,
  router: CommercialContextRouter | undefined,
  handlerKey: RouterHandlerKey,
): T {
  if (!router || !isCommercialContextRoutingEnabled(router.flags)) {
    return props;
  }

  const routed = router[handlerKey]() as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...props };

  for (const [key, fn] of Object.entries(routed)) {
    const existing = merged[key];
    if (typeof fn !== "function") continue;
    merged[key] = (...args: unknown[]) => {
      (fn as (...a: unknown[]) => void)(...args);
      if (typeof existing === "function") {
        (existing as (...a: unknown[]) => void)(...args);
      }
    };
  }

  return merged as T;
}
