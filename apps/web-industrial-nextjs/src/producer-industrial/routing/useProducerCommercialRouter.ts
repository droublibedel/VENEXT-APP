"use client";

import { useCallback, useMemo, useState } from "react";

import {
  applyProducerBackNavigation,
  createProducerCommercialRouter,
  isCommercialContextHistoryEnabled,
  isCommercialContextRoutingEnabled,
  type CommercialContextReference,
  type CommercialContextRoutingFlags,
  type ProducerWorkspaceTabDestination,
} from "commercial-context-routing";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import type { ProducerPoleId } from "../navigation/producer-navigation.config";

export function useProducerCommercialRouter(
  setActivePole: (pole: ProducerPoleId) => void,
  setRelationalTab?: (tab: ProducerWorkspaceTabDestination) => void,
) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
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
    return createProducerCommercialRouter({
      flags: routingFlags,
      navigation: {
        setActivePole: (pole) => setActivePole(pole as ProducerPoleId),
        setRelationalTab,
        setFocusReference,
      },
    });
  }, [hydrated, routingFlags, setActivePole, setRelationalTab]);

  const canGoBack = Boolean(
    router &&
      isCommercialContextHistoryEnabled(routingFlags) &&
      router.store.history.length >= 2,
  );

  const goBack = useCallback(() => {
    if (!router) return;
    const prev = router.goBack();
    applyProducerBackNavigation(prev, (pole) => setActivePole(pole as ProducerPoleId), setRelationalTab);
    if (prev) setFocusReference(prev);
  }, [router, setActivePole, setRelationalTab]);

  return {
    router,
    routingInput: { router: router ?? undefined, flags: routingFlags },
    focusReference,
    canGoBack,
    goBack,
  };
}
