import { useCallback, useEffect, useRef, useState } from "react";

import {
  mockGrossisteActivity,
  mockGrossisteCatalog,
  mockGrossisteNetwork,
  mockGrossisteOrders,
  GROSSISTE_B_ORG_ID,
} from "../mocks/grossiste-b-mock-data";
import type {
  GrossisteActivityDto,
  GrossisteBffEndpoint,
  GrossisteCatalogDto,
  GrossisteDataSource,
  GrossisteEnvelope,
  GrossisteLiveState,
  GrossisteNetworkDto,
  GrossisteOrdersDto,
} from "./grossiste-b-data.types";
import { useGrossisteFeatureFlags } from "./useGrossisteFeatureFlags";

const cache = new Map<string, GrossisteEnvelope<unknown>>();

export function clearGrossisteDataCache() {
  cache.clear();
}

function cacheKey(endpoint: string, organizationId: string) {
  return `${endpoint}:${organizationId}`;
}

async function fetchGrossisteEndpoint<T>(
  endpoint: GrossisteBffEndpoint,
  organizationId: string,
  signal?: AbortSignal,
): Promise<{ envelope: GrossisteEnvelope<T> | null; error: string | null }> {
  const url = `/api/grossiste-b/${endpoint}?organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", signal });
    if (!res.ok) return { envelope: null, error: `http_${res.status}` };
    const body = (await res.json()) as GrossisteEnvelope<T>;
    return { envelope: body, error: null };
  } catch {
    return { envelope: null, error: "network" };
  }
}

type FallbackFn<T> = () => GrossisteEnvelope<T>;

function useGrossisteEndpoint<T>(
  endpoint: GrossisteBffEndpoint,
  fallback: FallbackFn<T>,
  enabled = true,
  organizationId = GROSSISTE_B_ORG_ID,
): GrossisteLiveState<T> {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const liveEnabled =
    hydrated &&
    flags.grossiste_b_live_data_enabled !== false &&
    flags.venext_bff_routes_enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<GrossisteDataSource>("fallback");
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
      cache.set(cacheKey(endpoint, organizationId), fb as GrossisteEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
      return;
    }

    const key = cacheKey(endpoint, organizationId);
    const cached = cache.get(key) as GrossisteEnvelope<T> | undefined;
    if (cached) {
      setData(cached.payload);
      setDataSource(cached.dataSource);
      setFallbackUsed(cached.fallbackUsed);
    }

    setLoading(true);
    setError(null);

    void fetchGrossisteEndpoint<T>(endpoint, organizationId, ac.signal).then((result) => {
      if (tick !== tickRef.current) return;
      if (result.envelope) {
        cache.set(key, result.envelope as GrossisteEnvelope<unknown>);
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
        setError(result.error ?? "unavailable");
        setLoading(false);
        return;
      }
      const fb = fallbackRef.current();
      cache.set(key, fb as GrossisteEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(result.error);
      setLoading(false);
    });
  }, [enabled, endpoint, liveEnabled, organizationId, flags.venext_live_data_fallback_enabled]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { data, loading, error, dataSource, fallbackUsed, refresh: load };
}

function envelope<T>(payload: T): GrossisteEnvelope<T> {
  return {
    dataSource: "fallback",
    fallbackUsed: true,
    organizationId: GROSSISTE_B_ORG_ID,
    payload,
  };
}

export function useGrossisteActivityData(enabled = true) {
  return useGrossisteEndpoint<GrossisteActivityDto>(
    "activity",
    () => envelope(mockGrossisteActivity()),
    enabled,
  );
}

export function useGrossisteCatalogData(enabled = true) {
  return useGrossisteEndpoint<GrossisteCatalogDto>(
    "catalog",
    () => envelope(mockGrossisteCatalog()),
    enabled,
  );
}

export function useGrossisteOrdersData(enabled = true) {
  return useGrossisteEndpoint<GrossisteOrdersDto>(
    "orders",
    () => envelope(mockGrossisteOrders()),
    enabled,
  );
}

export function useGrossisteNetworkData(enabled = true) {
  return useGrossisteEndpoint<GrossisteNetworkDto>(
    "network",
    () => envelope(mockGrossisteNetwork()),
    enabled,
  );
}
