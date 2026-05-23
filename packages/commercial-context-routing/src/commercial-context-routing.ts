import type {
  CommercialContextReference,
  CommercialContextRoutingFlags,
  CommercialContextStore,
} from "./commercial-context-routing.types";

export function isCommercialContextRoutingEnabled(
  flags: CommercialContextRoutingFlags = {},
): boolean {
  return flags.commercial_context_routing_enabled !== false;
}

export function isCommercialContextHistoryEnabled(
  flags: CommercialContextRoutingFlags = {},
): boolean {
  return (
    flags.commercial_context_history_enabled !== false &&
    isCommercialContextRoutingEnabled(flags)
  );
}

export function isCrossModuleNavigationEnabled(
  flags: CommercialContextRoutingFlags = {},
): boolean {
  return (
    flags.commercial_cross_module_navigation_enabled !== false &&
    isCommercialContextRoutingEnabled(flags)
  );
}

export function createEmptyCommercialContext(): CommercialContextReference {
  return {};
}

export function createCommercialContextStore(
  initial: CommercialContextReference = {},
): CommercialContextStore {
  return {
    active: { ...initial },
    history: [],
  };
}

export function setActiveCommercialContext(
  store: CommercialContextStore,
  next: CommercialContextReference,
): CommercialContextReference {
  store.active = { ...next };
  return store.active;
}

export function pickPrimaryContextKey(
  ref: CommercialContextReference,
): keyof CommercialContextReference | null {
  const priority: (keyof CommercialContextReference)[] = [
    "orderId",
    "deliveryId",
    "conversationId",
    "settlementId",
    "mailThreadId",
    "catalogId",
    "activityId",
    "partnerId",
  ];
  for (const key of priority) {
    if (ref[key]) return key;
  }
  return ref.activeModule ? "activeModule" : null;
}

export function assertSingleActiveContext(store: CommercialContextStore): boolean {
  const keys = [
    store.active.orderId,
    store.active.deliveryId,
    store.active.conversationId,
    store.active.settlementId,
  ].filter(Boolean);
  return keys.length <= 1 || Boolean(store.active.activeModule);
}
