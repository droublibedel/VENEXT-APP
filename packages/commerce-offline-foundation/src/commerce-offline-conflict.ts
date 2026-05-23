import type {
  CommerceOfflineConflict,
  CommerceOfflineConflictCode,
  CommerceOfflineQueueItem,
} from "./commerce-offline.types";
import { getOfflineTranslation } from "./commerce-offline-i18n";

export function resolveCommercialConflict(
  item: CommerceOfflineQueueItem,
  serverCode: CommerceOfflineConflictCode,
): CommerceOfflineConflict {
  const messageKey = `offline.conflict.${serverCode}`;
  return {
    code: serverCode,
    actionId: item.id,
    messageKey,
    resolved: true,
  };
}

export function buildConflictLabel(
  conflict: CommerceOfflineConflict,
  locale = "fr-CI",
): string {
  return getOfflineTranslation(conflict.messageKey, locale);
}

export function inferConflictFromError(
  item: CommerceOfflineQueueItem,
  error: unknown,
): CommerceOfflineConflict | null {
  const msg = String(error instanceof Error ? error.message : error ?? "").toLowerCase();
  if (msg.includes("already confirmed") || msg.includes("order_confirmed")) {
    return resolveCommercialConflict(item, "ORDER_ALREADY_CONFIRMED");
  }
  if (msg.includes("delivery") && (msg.includes("closed") || msg.includes("completed"))) {
    return resolveCommercialConflict(item, "DELIVERY_ALREADY_CLOSED");
  }
  if (msg.includes("relation") && msg.includes("removed")) {
    return resolveCommercialConflict(item, "RELATION_REMOVED");
  }
  if (msg.includes("stale") || msg.includes("expired")) {
    return resolveCommercialConflict(item, "STALE_CACHE");
  }
  return null;
}
