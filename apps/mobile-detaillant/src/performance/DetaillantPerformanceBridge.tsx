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
import { resolveDetaillantOrganizationId } from "../session/resolveDetaillantOrganizationId";

export function DetaillantPerformanceBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const organizationId = resolveDetaillantOrganizationId();

  useEffect(() => {
    if (!hydrated || !isCommercePerformanceEnabled(flags)) return;
    runCommerceStorageCleanup(organizationId);
  }, [flags, hydrated, organizationId]);

  useEffect(() => {
    if (!hydrated || !isCommerceSecureCleanupEnabled(flags)) return;

    const unsubSession = subscribeCommerceSessionCleanup((detail) => {
      runFullCommerceSessionCleanup({
        organizationId: detail.organizationId || organizationId,
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
  }, [flags, hydrated, organizationId]);

  return null;
}
