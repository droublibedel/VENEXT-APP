export type CommerceConnectivityMode = "ONLINE" | "DEGRADED" | "OFFLINE";

export type CommerceOfflineActorRole =
  | "PRODUCER"
  | "GROSSISTE_A"
  | "GROSSISTE_B"
  | "DETAILLANT";

export type CommerceOfflineCacheDomain =
  | "relational_catalog"
  | "recent_orders"
  | "recent_deliveries"
  | "recent_activity"
  | "notifications"
  | "recent_conversations"
  | "commercial_context"
  | "user_preferences"
  | "i18n"
  | "session";

export type CommerceOfflineQueueActionType =
  | "SEND_MESSAGE"
  | "CONFIRM_ORDER"
  | "CONFIRM_DELIVERY"
  | "MARK_NOTIFICATION_READ"
  | "ACTIVATE_RELATION"
  | "WALLET_LIGHT_ACTION";

export type CommerceOfflineQueueItem = {
  id: string;
  type: CommerceOfflineQueueActionType;
  organizationId: string;
  relationshipId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
};

export type CommerceOfflineCacheEntry<T = unknown> = {
  key: string;
  domain: CommerceOfflineCacheDomain;
  organizationId: string;
  payload: T;
  cachedAt: string;
  expiresAt: string;
};

export type CommerceOfflineSyncState = {
  mode: CommerceConnectivityMode;
  lastSyncAt: string | null;
  pendingCount: number;
  inProgress: boolean;
  lastError: string | null;
};

export type CommerceOfflineConflictCode =
  | "ORDER_ALREADY_CONFIRMED"
  | "DELIVERY_ALREADY_CLOSED"
  | "RELATION_REMOVED"
  | "STALE_CACHE"
  | "UNKNOWN";

export type CommerceOfflineConflict = {
  code: CommerceOfflineConflictCode;
  actionId: string;
  messageKey: string;
  resolved: boolean;
};

export type CommerceOfflineBootstrapPayload = {
  organizationId: string;
  actorRole: CommerceOfflineActorRole;
  cachedAt: string;
  recentOrders: unknown[];
  recentDeliveries: unknown[];
  recentActivity: unknown[];
  notifications: unknown[];
  recentConversations: unknown[];
  relationalCatalog: unknown[];
  commercialContext: Record<string, unknown> | null;
  preferences: Record<string, unknown>;
};

export type CommerceOfflineEnvelope<T> = {
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  devBadge?: boolean;
  payload: T;
};

export type CommerceOfflineFlags = {
  commerce_offline_foundation_enabled?: boolean;
  commerce_offline_sync_enabled?: boolean;
  commerce_offline_queue_enabled?: boolean;
  commercial_relationship_governance_enabled?: boolean;
  venext_bff_routes_enabled?: boolean;
  venext_live_data_fallback_enabled?: boolean;
};

export type CommerceOfflineState = {
  connectivity: CommerceConnectivityMode;
  sync: CommerceOfflineSyncState;
  queue: CommerceOfflineQueueItem[];
  bootstrap: CommerceOfflineBootstrapPayload | null;
  loading: boolean;
  fallbackUsed: boolean;
  refresh: () => void;
  syncNow: () => Promise<void>;
  enqueue: (item: Omit<CommerceOfflineQueueItem, "id" | "createdAt" | "attempts">) => string;
  discardQueueItem: (id: string) => void;
};

export const COMMERCE_OFFLINE_CACHE_NS = "venext_offline_cache_v1";
export const COMMERCE_OFFLINE_QUEUE_NS = "venext_offline_queue_v1";
export const COMMERCE_OFFLINE_SYNC_NS = "venext_sync_state_v1";

export const COMMERCE_OFFLINE_TTL_DAYS: Record<CommerceOfflineCacheDomain, number> = {
  recent_activity: 30,
  notifications: 14,
  recent_conversations: 7,
  recent_orders: 30,
  recent_deliveries: 30,
  relational_catalog: 30,
  commercial_context: 30,
  user_preferences: 30,
  i18n: 30,
  session: 30,
};

export const COMMERCE_OFFLINE_SYNC_POLLING_MS = 0;
export const COMMERCE_OFFLINE_CONNECTIVITY_PROBE_MS = 8000;
