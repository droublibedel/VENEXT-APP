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
import { resolveGrossisteBOrganizationId } from "../session/resolveGrossisteBOrganizationId";

/** Performance + session cleanup (Instructions 20.85 / 20.85-A). */
export function GrossisteBPerformanceBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommercePerformanceEnabled(flags)) return;
    runCommerceStorageCleanup(resolveGrossisteBOrganizationId());
  }, [flags, hydrated]);

  useEffect(() => {
    if (!hydrated || !isCommerceSecureCleanupEnabled(flags)) return;

    const unsubSession = subscribeCommerceSessionCleanup((detail) => {
      runFullCommerceSessionCleanup({
        organizationId: detail.organizationId || resolveGrossisteBOrganizationId(),
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
