export type CommercePerformanceFlags = {
  commerce_performance_foundation_enabled?: boolean;
  commerce_secure_cleanup_enabled?: boolean;
  commerce_light_virtualization_enabled?: boolean;
  commerce_secure_wallet_navigation_enabled?: boolean;
  commerce_notifications_enabled?: boolean;
  commerce_offline_foundation_enabled?: boolean;
  venext_i18n_enabled?: boolean;
  venext_auth_foundation_enabled?: boolean;
  commercial_activity_feed_enabled?: boolean;
  commercial_context_routing_enabled?: boolean;
  commerce_access_control_enabled?: boolean;
  venext_bff_routes_enabled?: boolean;
};

export type CommerceCleanupResult = {
  offlinePurged: number;
  notificationsTrimmed: number;
  contextHistoryTrimmed: number;
};

export type FullCommerceCleanupResult = CommerceCleanupResult & {
  messagingCacheCleared: number;
  catalogCacheCleared: number;
  secureWalletMemoryCleared: boolean;
  runtimeInvalidated: boolean;
  reason?: string;
};

export type LightweightEnvelope<T> = {
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  payload: T;
  trimmed?: boolean;
  itemCount?: number;
};
