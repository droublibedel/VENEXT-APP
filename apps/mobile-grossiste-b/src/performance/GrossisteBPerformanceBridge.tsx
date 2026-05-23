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

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { GROSSISTE_B_ORG_ID } from "../mocks/grossiste-b-mock-data";

/** Performance + session cleanup (Instructions 20.85 / 20.85-A). */
export function GrossisteBPerformanceBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommercePerformanceEnabled(flags)) return;
    runCommerceStorageCleanup(GROSSISTE_B_ORG_ID);
  }, [flags, hydrated]);

  useEffect(() => {
    if (!hydrated || !isCommerceSecureCleanupEnabled(flags)) return;

    const unsubSession = subscribeCommerceSessionCleanup((detail) => {
      runFullCommerceSessionCleanup({
        organizationId: detail.organizationId || GROSSISTE_B_ORG_ID,
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
