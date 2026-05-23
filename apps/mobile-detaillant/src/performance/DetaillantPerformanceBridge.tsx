import { useEffect } from "react";
import {
  isCommercePerformanceEnabled,
  isCommerceSecureCleanupEnabled,
  isCommerceSecureWalletNavigationEnabled,
  runCommerceStorageCleanup,
  runFullCommerceSessionCleanup,
  secureWalletNavigationReset,
  subscribeCommerceSessionCleanup,
  subscribeWalletSecuredLock,
} from "commerce-performance-foundation";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { DETAILLANT_ORG_ID } from "../mocks/detaillant-mock-data";

export function DetaillantPerformanceBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommercePerformanceEnabled(flags)) return;
    runCommerceStorageCleanup(DETAILLANT_ORG_ID);
  }, [flags, hydrated]);

  useEffect(() => {
    if (!hydrated || !isCommerceSecureCleanupEnabled(flags)) return;

    const unsubSession = subscribeCommerceSessionCleanup((detail) => {
      runFullCommerceSessionCleanup({
        organizationId: detail.organizationId || DETAILLANT_ORG_ID,
        reason: detail.reason,
      });
    });

    const unsubLock = subscribeWalletSecuredLock(() => {
      if (isCommerceSecureWalletNavigationEnabled(flags)) {
        secureWalletNavigationReset("wallet-lock");
      }
    });

    return () => {
      unsubSession();
      unsubLock();
    };
  }, [flags, hydrated]);

  return null;
}
