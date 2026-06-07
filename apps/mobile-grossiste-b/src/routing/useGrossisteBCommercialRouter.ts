import { useCallback, useMemo, useRef, useState } from "react";

import {
  applyGrossisteBBackNavigation,
  createGrossisteBCommercialRouter,
  isCommercialContextHistoryEnabled,
  isCommercialContextRoutingEnabled,
  type CommercialContextReference,
  type CommercialContextRoutingFlags,
} from "commercial-context-routing";

import type { GrossisteBTabId } from "../navigation/grossiste-b-navigation.config";
import { useGrossisteFeatureFlags, type GrossisteFlagsState } from "../hooks/useGrossisteFeatureFlags";

export function useGrossisteBCommercialRouter(
  setActiveTab: (tab: GrossisteBTabId) => void,
  options?: { flags?: GrossisteFlagsState; hydrated?: boolean },
) {
  const internalFlags = useGrossisteFeatureFlags();
  const flags = options?.flags ?? internalFlags.flags;
  const hydrated = options?.hydrated ?? internalFlags.hydrated;
  const routingReadyRef = useRef(hydrated);
  if (hydrated) routingReadyRef.current = true;
  const routingReady = routingReadyRef.current || hydrated;
  const [focusReference, setFocusReference] = useState<CommercialContextReference>({});

  const routingFlags: CommercialContextRoutingFlags = useMemo(
    () => ({
      commercial_context_routing_enabled: flags.commercial_context_routing_enabled,
      commercial_context_history_enabled: flags.commercial_context_history_enabled,
      commercial_cross_module_navigation_enabled: flags.commercial_cross_module_navigation_enabled,
    }),
    [flags],
  );

  const router = useMemo(() => {
    if (!routingReady || !isCommercialContextRoutingEnabled(routingFlags)) {
      return null;
    }
    return createGrossisteBCommercialRouter({
      flags: routingFlags,
      navigation: {
        setActiveTab,
        setFocusReference,
      },
    });
  }, [routingReady, routingFlags, setActiveTab]);

  const canGoBack = Boolean(
    router &&
      isCommercialContextHistoryEnabled(routingFlags) &&
      router.store.history.length >= 2,
  );

  const goBack = useCallback(() => {
    if (!router) return;
    const prev = router.goBack();
    applyGrossisteBBackNavigation(prev, setActiveTab);
    if (prev) setFocusReference(prev);
  }, [router, setActiveTab]);

  return {
    router,
    routingFlags,
    focusReference,
    routingInput: { router: router ?? undefined, flags: routingFlags },
    canGoBack,
    goBack,
  };
}
