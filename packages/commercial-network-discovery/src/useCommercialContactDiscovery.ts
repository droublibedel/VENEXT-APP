import { useCallback, useMemo, useState } from "react";

import type {
  CommercialContactSuggestion,
  CommercialDiscoveryInjected,
  CommercialDiscoveryView,
} from "./commercial-network-discovery.types";
import {
  mockCatalogPreview,
  mockCommercialDiscoveryView,
  rankContactSuggestions,
} from "./commercial-network-discovery-mock-data";
import { applyTerrainIdentityToView } from "./identity/applyTerrainDisplayIdentity";
import type { CommercialDiscoveryFlags } from "./commercial-network-discovery.types";

export function useCommercialContactDiscovery(input: {
  actorRole: "grossiste_b" | "detaillant";
  injected?: CommercialDiscoveryInjected;
  enabled?: boolean;
  flags?: CommercialDiscoveryFlags;
}): CommercialDiscoveryInjected {
  const { actorRole, injected, enabled = true, flags = {} } = input;
  const [localConnected, setLocalConnected] = useState<string[]>([]);
  const [syncGranted, setSyncGranted] = useState(
    injected?.view?.contactSyncGranted ?? false,
  );

  const fallbackView = useMemo(
    () => (enabled ? mockCommercialDiscoveryView(actorRole) : null),
    [actorRole, enabled],
  );

  const baseView = injected?.view ?? fallbackView;

  const view: CommercialDiscoveryView | null = useMemo(() => {
    if (!baseView) return null;
    const suggestions = rankContactSuggestions(baseView.suggestions).map((s) => ({
      ...s,
      partnerStatus: localConnected.includes(s.id)
        ? ("connected" as const)
        : s.partnerStatus,
    }));
    const merged = {
      ...baseView,
      contactSyncGranted: syncGranted,
      suggestions,
    };
    return applyTerrainIdentityToView(merged, actorRole, flags);
  }, [actorRole, baseView, flags, localConnected, syncGranted]);

  const catalogByPartnerId = useMemo(() => {
    if (injected?.catalogByPartnerId) return injected.catalogByPartnerId;
    const map: Record<string, ReturnType<typeof mockCatalogPreview>> = {};
    for (const s of view?.suggestions ?? []) {
      map[s.id] = mockCatalogPreview(s.id, s.displayName);
    }
    for (const c of view?.connected ?? []) {
      map[c.id] = mockCatalogPreview(c.id, c.displayName);
    }
    return map;
  }, [injected?.catalogByPartnerId, view]);

  const onConnect = useCallback(
    (suggestionId: string) => {
      setLocalConnected((prev) => (prev.includes(suggestionId) ? prev : [...prev, suggestionId]));
      injected?.onConnect?.(suggestionId);
    },
    [injected],
  );

  const grantContactSync = useCallback(() => {
    setSyncGranted(true);
  }, []);

  return {
    view,
    catalogByPartnerId,
    dataSource: injected?.dataSource ?? "fallback",
    fallbackUsed: injected?.fallbackUsed ?? true,
    loading: injected?.loading ?? false,
    error: injected?.error ?? null,
    onRefresh: injected?.onRefresh,
    onConnect,
    onQuickOrder: injected?.onQuickOrder,
    onMessage: injected?.onMessage,
    grantContactSync,
  };
}

export function filterVisibleSuggestions(
  suggestions: CommercialContactSuggestion[],
  syncGranted: boolean,
): CommercialContactSuggestion[] {
  if (!syncGranted) return suggestions.slice(0, 2);
  return suggestions;
}
