import { useCallback, useEffect, useRef, useState } from "react";

import {
  mockDetaillantHome,
  mockDetaillantNetwork,
  mockDetaillantOrders,
  mockDetaillantProducts,
} from "../mocks/detaillant-mock-data";
import { resolveDetaillantOrganizationId } from "../session/resolveDetaillantOrganizationId";
import type {
  DetaillantBffEndpoint,
  DetaillantDataSource,
  DetaillantEnvelope,
  DetaillantHomeDto,
  DetaillantLiveState,
  DetaillantNetworkDto,
  DetaillantOrdersDto,
  DetaillantProductsDto,
} from "./detaillant-data.types";
import { useDetaillantFeatureFlags } from "./useDetaillantFeatureFlags";

const cache = new Map<string, DetaillantEnvelope<unknown>>();

export function clearDetaillantDataCache() {
  cache.clear();
}

function cacheKey(endpoint: string, organizationId: string) {
  return `${endpoint}:${organizationId}`;
}

async function fetchDetaillantEndpoint<T>(
  endpoint: DetaillantBffEndpoint,
  organizationId: string,
  signal?: AbortSignal,
): Promise<{ envelope: DetaillantEnvelope<T> | null; error: string | null }> {
  const url = `/api/detaillant/${endpoint}?organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", signal });
    if (!res.ok) return { envelope: null, error: `http_${res.status}` };
    return { envelope: (await res.json()) as DetaillantEnvelope<T>, error: null };
  } catch {
    return { envelope: null, error: "network" };
  }
}

type FallbackFn<T> = () => DetaillantEnvelope<T>;

function envelope<T>(payload: T): DetaillantEnvelope<T> {
  return {
    dataSource: "fallback",
    fallbackUsed: true,
    organizationId: resolveDetaillantOrganizationId(),
    payload,
  };
}

function useDetaillantEndpoint<T>(
  endpoint: DetaillantBffEndpoint,
  fallback: FallbackFn<T>,
  enabled = true,
  organizationId = resolveDetaillantOrganizationId(),
): DetaillantLiveState<T> {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const liveEnabled =
    hydrated &&
    flags.detaillant_live_data_enabled !== false &&
    flags.venext_bff_routes_enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DetaillantDataSource>("fallback");
  const [fallbackUsed, setFallbackUsed] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const tickRef = useRef(0);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

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
      const fb = fallbackRef.current();
      cache.set(cacheKey(endpoint, organizationId), fb as DetaillantEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
      return;
    }

    const key = cacheKey(endpoint, organizationId);
    const cached = cache.get(key) as DetaillantEnvelope<T> | undefined;
    if (cached) {
      setData(cached.payload);
      setDataSource(cached.dataSource);
      setFallbackUsed(cached.fallbackUsed);
    }

    setLoading(true);
    setError(null);

    void fetchDetaillantEndpoint<T>(endpoint, organizationId, ac.signal).then((result) => {
      if (tick !== tickRef.current) return;
      if (result.envelope) {
        cache.set(key, result.envelope as DetaillantEnvelope<unknown>);
        setData(result.envelope.payload);
        setDataSource(result.envelope.dataSource);
        setFallbackUsed(result.envelope.fallbackUsed);
        setError(null);
        setLoading(false);
        return;
      }

      const fb = fallbackRef.current();
      cache.set(key, fb as DetaillantEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(result.error);
      setLoading(false);
    });
  }, [enabled, endpoint, liveEnabled, organizationId]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { data, loading, error, dataSource, fallbackUsed, refresh: load };
}

export function useDetaillantHomeData(enabled = true) {
  return useDetaillantEndpoint<DetaillantHomeDto>("home", () => envelope(mockDetaillantHome()), enabled);
}

export function useDetaillantProductsData(enabled = true) {
  return useDetaillantEndpoint<DetaillantProductsDto>(
    "products",
    () => envelope(mockDetaillantProducts()),
    enabled,
  );
}

export function useDetaillantOrdersData(enabled = true) {
  return useDetaillantEndpoint<DetaillantOrdersDto>("orders", () => envelope(mockDetaillantOrders()), enabled);
}

export function useDetaillantNetworkData(enabled = true) {
  return useDetaillantEndpoint<DetaillantNetworkDto>(
    "network",
    () => envelope(mockDetaillantNetwork()),
    enabled,
  );
}
