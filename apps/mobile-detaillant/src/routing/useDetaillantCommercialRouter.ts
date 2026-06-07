import { useCallback, useMemo, useRef, useState } from "react";

import {
  applyDetaillantBackNavigation,
  createDetaillantCommercialRouter,
  isCommercialContextHistoryEnabled,
  isCommercialContextRoutingEnabled,
  type CommercialContextReference,
  type CommercialContextRoutingFlags,
} from "commercial-context-routing";

import type { DetaillantTabId } from "../navigation/detaillant-navigation.config";
import { useDetaillantFeatureFlags, type DetaillantFlagsState } from "../hooks/useDetaillantFeatureFlags";

export function useDetaillantCommercialRouter(
  setActiveTab: (tab: DetaillantTabId) => void,
  options?: { flags?: DetaillantFlagsState; hydrated?: boolean },
) {
  const internalFlags = useDetaillantFeatureFlags();
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
    return createDetaillantCommercialRouter({
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
    applyDetaillantBackNavigation(prev, setActiveTab);
    if (prev) setFocusReference(prev);
  }, [router, setActiveTab]);

  return {
    router,
    routingInput: { router: router ?? undefined, flags: routingFlags },
    focusReference,
    canGoBack,
    goBack,
  };
}
