export type {
  CommercePerformanceFlags,
  CommerceCleanupResult,
  FullCommerceCleanupResult,
  LightweightEnvelope,
} from "./commerce-performance.types";

export {
  PERF_MAX_VISIBLE_NOTIFICATIONS,
  PERF_MAX_VISIBLE_ACTIVITY_ITEMS,
  PERF_MAX_VISIBLE_MESSAGES,
  PERF_MAX_VISIBLE_ORDERS,
  PERF_MAX_VISIBLE_CATALOG_PRODUCTS,
  PERF_MAX_CONTEXT_HISTORY,
  PERF_MAX_NOTIFICATION_CACHE,
  PERF_DEFAULT_PAGE_SIZE,
  PERF_POLLING_FORBIDDEN_MS,
  PERF_WEBSOCKET_FORBIDDEN,
} from "./commerce-performance-limits";

export {
  paginateLight,
  sliceVisibleWindow,
  batchSlice,
} from "./commerce-performance-virtualization";
export type { PaginateLightResult } from "./commerce-performance-virtualization";

export {
  cleanupOfflineCache,
  cleanupNotificationCache,
  cleanupContextHistory,
  cleanupMessagingCache,
  cleanupCatalogCache,
  clearSecureWalletMemory,
  invalidateOfflineReplayCache,
  isOfflineReplayInvalidated,
  runCommerceStorageCleanup,
  runFullCommerceSessionCleanup,
} from "./commerce-performance-cleanup";
export type { ContextHistoryStore } from "./commerce-performance-cleanup";

export {
  sliceVisibleConversationWindow,
  buildVisibleMessageWindow,
  nextOlderMessageOffset,
} from "./commerce-performance-messaging-window";
export type { VisibleMessageWindow } from "./commerce-performance-messaging-window";

export {
  sliceVisibleCatalogWindow,
  buildVisibleCatalogBatch,
} from "./commerce-performance-catalog-window";
export type { VisibleCatalogBatch } from "./commerce-performance-catalog-window";

export {
  COMMERCE_SESSION_CLEANUP_EVENT,
  WALLET_SECURED_LOCK_EVENT,
  dispatchCommerceSessionCleanup,
  dispatchWalletSecuredLock,
  subscribeCommerceSessionCleanup,
  subscribeWalletSecuredLock,
} from "./commerce-performance-session-events";
export type {
  CommerceSessionCleanupReason,
  CommerceSessionCleanupDetail,
} from "./commerce-performance-session-events";

export {
  invalidateRuntimeCommerceState,
  getRuntimeCommerceGeneration,
  subscribeRuntimeInvalidation,
  clearRuntimeMemo,
  setRuntimeMemo,
  getRuntimeMemo,
} from "./commerce-performance-runtime-invalidation";

export {
  SENSITIVE_WALLET_ROUTES,
  secureWalletNavigationReset,
  clearSensitiveNavigationHistory,
  isWalletNavigationLocked,
  releaseWalletNavigationLock,
  getPostLockSafeRoute,
  assertAndroidBackFromWalletBlocked,
  isSensitiveWalletRoute,
  pushSensitiveNavigationRoute,
  consumePostLockNavigationIntent,
} from "./commerce-performance-wallet-navigation";
export type { SensitiveWalletRoute } from "./commerce-performance-wallet-navigation";

export {
  assertNoWebsocketInStack,
  assertManualRefreshOnly,
  assertNoAggressivePollingInCode,
  dedupeFetch,
  clearDedupeFetchCache,
} from "./commerce-performance-network";

export { trimPayload, lightweightEnvelope } from "./commerce-performance-payload";

export {
  auditFeatureFlagConsistency,
  isCommercePerformanceEnabled,
  isCommerceSecureCleanupEnabled,
  isCommerceLightVirtualizationEnabled,
  isCommerceSecureWalletNavigationEnabled,
} from "./commerce-performance-feature-flags";
export type { FeatureFlagAuditIssue } from "./commerce-performance-feature-flags";

export {
  domainCacheKey,
  markDomainLoaded,
  isDomainLoaded,
  clearDomainLoadCache,
  memoTranslationKey,
} from "./commerce-performance-i18n";

export { lazyImageProps, catalogThumbnailSize } from "./commerce-performance-image";
export type { LazyImageProps } from "./commerce-performance-image";

export { shallowEqualProps, stableListKey } from "./commerce-performance-react";
