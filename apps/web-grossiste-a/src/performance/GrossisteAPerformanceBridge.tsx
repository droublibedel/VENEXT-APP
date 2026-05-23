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

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { GROSSISTE_A_ORG_ID } from "../mocks/grossiste-a-mock-data";

const ORG = GROSSISTE_A_ORG_ID;

export function GrossisteAPerformanceBridge() {
  const { flags, hydrated } = useGrossisteAFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommercePerformanceEnabled(flags)) return;
    runCommerceStorageCleanup(ORG);
  }, [flags, hydrated]);

  useEffect(() => {
    if (!hydrated || !isCommerceSecureCleanupEnabled(flags)) return;

    const unsubSession = subscribeCommerceSessionCleanup((detail) => {
      runFullCommerceSessionCleanup({
        organizationId: detail.organizationId || ORG,
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
