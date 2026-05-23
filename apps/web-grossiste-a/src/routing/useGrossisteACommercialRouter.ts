import { useCallback, useMemo, useState } from "react";

import {
  applyGrossisteABackNavigation,
  createGrossisteACommercialRouter,
  isCommercialContextHistoryEnabled,
  isCommercialContextRoutingEnabled,
  type CommercialContextReference,
  type CommercialContextRoutingFlags,
} from "commercial-context-routing";

import type { GrossisteAWorkspaceId } from "../navigation/grossiste-a-navigation.config";
import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";

export function useGrossisteACommercialRouter(
  setActiveWorkspace: (workspace: GrossisteAWorkspaceId) => void,
) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
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
    if (!hydrated || !isCommercialContextRoutingEnabled(routingFlags)) {
      return null;
    }
    return createGrossisteACommercialRouter({
      flags: routingFlags,
      navigation: {
        setActiveWorkspace,
        setFocusReference,
      },
    });
  }, [hydrated, routingFlags, setActiveWorkspace]);

  const canGoBack = Boolean(
    router &&
      isCommercialContextHistoryEnabled(routingFlags) &&
      router.store.history.length >= 2,
  );

  const goBack = useCallback(() => {
    if (!router) return;
    const prev = router.goBack();
    applyGrossisteABackNavigation(prev, setActiveWorkspace);
    if (prev) setFocusReference(prev);
  }, [router, setActiveWorkspace]);

  return {
    router,
    routingInput: { router: router ?? undefined, flags: routingFlags },
    focusReference,
    canGoBack,
    goBack,
  };
}
