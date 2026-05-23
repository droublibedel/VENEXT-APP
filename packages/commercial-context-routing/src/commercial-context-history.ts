import { isCommercialContextHistoryEnabled } from "./commercial-context-routing";
import type {
  CommercialContextHistoryEntry,
  CommercialContextModule,
  CommercialContextReference,
  CommercialContextRoutingFlags,
  CommercialContextStore,
} from "./commercial-context-routing.types";

const MAX_HISTORY = 5;

export type CommercialContextHistorySnapshot = {
  lastPartnerId?: string;
  lastOrderId?: string;
  lastConversationId?: string;
  lastSettlementId?: string;
  lastDeliveryId?: string;
  entries: CommercialContextHistoryEntry[];
};

export function pushCommercialContextHistory(
  store: CommercialContextStore,
  entry: Omit<CommercialContextHistoryEntry, "at">,
  flags: CommercialContextRoutingFlags = {},
): CommercialContextHistoryEntry[] {
  if (!isCommercialContextHistoryEnabled(flags)) return store.history;

  const row: CommercialContextHistoryEntry = { ...entry, at: Date.now() };
  store.history = [row, ...store.history].slice(0, MAX_HISTORY);
  return store.history;
}

export function buildCommercialContextHistory(
  store: CommercialContextStore,
  flags: CommercialContextRoutingFlags = {},
): CommercialContextHistorySnapshot {
  if (!isCommercialContextHistoryEnabled(flags)) {
    return { entries: [] };
  }

  const findLast = (module: CommercialContextModule, key: keyof CommercialContextReference) => {
    const hit = store.history.find((h) => h.module === module && h.reference[key]);
    return hit?.reference[key] as string | undefined;
  };

  return {
    lastPartnerId: findLast("messaging", "partnerId") ?? findLast("order", "partnerId"),
    lastOrderId: findLast("order", "orderId"),
    lastConversationId: findLast("messaging", "conversationId"),
    lastSettlementId: findLast("wallet", "settlementId"),
    lastDeliveryId: findLast("delivery", "deliveryId"),
    entries: [...store.history],
  };
}

export function trimCommercialContextHistory<T extends { at: number }>(
  history: T[],
  maxEntries = MAX_HISTORY,
): T[] {
  return history.slice(0, Math.max(1, maxEntries));
}

export function restorePreviousCommercialContext(
  store: CommercialContextStore,
  flags: CommercialContextRoutingFlags = {},
): CommercialContextReference | null {
  if (!isCommercialContextHistoryEnabled(flags) || store.history.length < 2) {
    return null;
  }
  const [, previous] = store.history;
  if (!previous) return null;
  store.active = { ...previous.reference };
  store.history = store.history.slice(1);
  return store.active;
}
