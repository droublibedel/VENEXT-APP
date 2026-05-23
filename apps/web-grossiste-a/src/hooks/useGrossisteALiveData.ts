import { useCallback, useEffect, useRef, useState } from "react";

import {
  GROSSISTE_A_ORG_ID,
  mockGrossisteACatalog,
  mockGrossisteADistribution,
  mockGrossisteAFinance,
  mockGrossisteAIntelligence,
  mockGrossisteANetwork,
  mockGrossisteAOrders,
  mockGrossisteAOverview,
  mockGrossisteATerritory,
} from "../mocks/grossiste-a-mock-data";
import type {
  GrossisteABffEndpoint,
  GrossisteACatalogDto,
  GrossisteADataSource,
  GrossisteADistributionDto,
  GrossisteAEnvelope,
  GrossisteAFinanceDto,
  GrossisteAIntelligenceDto,
  GrossisteALiveState,
  GrossisteANetworkDto,
  GrossisteAOrdersDto,
  GrossisteAOverviewDto,
  GrossisteATerritoryDto,
} from "./grossiste-a-data.types";
import { useGrossisteAFeatureFlags } from "./useGrossisteAFeatureFlags";

const cache = new Map<string, GrossisteAEnvelope<unknown>>();

export function clearGrossisteADataCache() {
  cache.clear();
}

function envelope<T>(payload: T): GrossisteAEnvelope<T> {
  return { dataSource: "fallback", fallbackUsed: true, organizationId: GROSSISTE_A_ORG_ID, payload };
}

async function fetchEndpoint<T>(
  endpoint: GrossisteABffEndpoint,
  organizationId: string,
  signal?: AbortSignal,
): Promise<{ envelope: GrossisteAEnvelope<T> | null; error: string | null }> {
  const url = `/api/grossiste-a/${endpoint}?organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", signal });
    if (!res.ok) return { envelope: null, error: `http_${res.status}` };
    return { envelope: (await res.json()) as GrossisteAEnvelope<T>, error: null };
  } catch {
    return { envelope: null, error: "network" };
  }
}

function useEndpoint<T>(
  endpoint: GrossisteABffEndpoint,
  fallback: () => GrossisteAEnvelope<T>,
  enabled = true,
): GrossisteALiveState<T> {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const liveEnabled =
    hydrated &&
    flags.grossiste_a_live_data_enabled !== false &&
    flags.venext_bff_routes_enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<GrossisteADataSource>("fallback");
  const [fallbackUsed, setFallbackUsed] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef(0);
  const fbRef = useRef(fallback);
  fbRef.current = fallback;

  const load = useCallback(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    tickRef.current += 1;
    const tick = tickRef.current;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    if (!liveEnabled) {
      const fb = fbRef.current();
      cache.set(`${endpoint}:${GROSSISTE_A_ORG_ID}`, fb as GrossisteAEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
      return;
    }

    const key = `${endpoint}:${GROSSISTE_A_ORG_ID}`;
    const cached = cache.get(key) as GrossisteAEnvelope<T> | undefined;
    if (cached) {
      setData(cached.payload);
      setDataSource(cached.dataSource);
      setFallbackUsed(cached.fallbackUsed);
    }
    setLoading(true);
    setError(null);

    void fetchEndpoint<T>(endpoint, GROSSISTE_A_ORG_ID, ac.signal).then((result) => {
      if (tick !== tickRef.current) return;
      if (result.envelope) {
        cache.set(key, result.envelope as GrossisteAEnvelope<unknown>);
        setData(result.envelope.payload);
        setDataSource(result.envelope.dataSource);
        setFallbackUsed(result.envelope.fallbackUsed);
        setError(null);
        setLoading(false);
        return;
      }
      if (flags.venext_live_data_fallback_enabled === false) {
        setData(null);
        setDataSource("fallback");
        setFallbackUsed(false);
        setError(null);
        setLoading(false);
        return;
      }
      const fb = fbRef.current();
      cache.set(key, fb as GrossisteAEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
    });
  }, [enabled, endpoint, liveEnabled, flags.venext_live_data_fallback_enabled]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { data, loading, error, dataSource, fallbackUsed, refresh: load };
}

export function useGrossisteAOverviewData(enabled = true) {
  return useEndpoint<GrossisteAOverviewDto>("overview", () => envelope(mockGrossisteAOverview()), enabled);
}
export function useGrossisteANetworkData(enabled = true) {
  return useEndpoint<GrossisteANetworkDto>("network", () => envelope(mockGrossisteANetwork()), enabled);
}
export function useGrossisteAOrdersData(enabled = true) {
  return useEndpoint<GrossisteAOrdersDto>("orders", () => envelope(mockGrossisteAOrders()), enabled);
}
export function useGrossisteADistributionData(enabled = true) {
  return useEndpoint<GrossisteADistributionDto>("distribution", () => envelope(mockGrossisteADistribution()), enabled);
}
export function useGrossisteACatalogData(enabled = true) {
  return useEndpoint<GrossisteACatalogDto>("catalog", () => envelope(mockGrossisteACatalog()), enabled);
}
export function useGrossisteATerritoryData(enabled = true) {
  return useEndpoint<GrossisteATerritoryDto>("territory", () => envelope(mockGrossisteATerritory()), enabled);
}
export function useGrossisteAFinanceData(enabled = true) {
  return useEndpoint<GrossisteAFinanceDto>("finance", () => envelope(mockGrossisteAFinance()), enabled);
}
export function useGrossisteAIntelligenceData(enabled = true) {
  return useEndpoint<GrossisteAIntelligenceDto>("intelligence", () => envelope(mockGrossisteAIntelligence()), enabled);
}

export function useGrossisteASettlementsData(enabled = true) {
  return useEndpoint<{ organizationId: string; settlements: unknown[] }>(
    "settlements",
    () => envelope({ organizationId: GROSSISTE_A_ORG_ID, settlements: [] }),
    enabled,
  );
}

export function useGrossisteAMessagingData(enabled = true) {
  return useEndpoint<{ organizationId: string; conversations: unknown[] }>(
    "messaging",
    () => envelope({ organizationId: GROSSISTE_A_ORG_ID, conversations: [] }),
    enabled,
  );
}
