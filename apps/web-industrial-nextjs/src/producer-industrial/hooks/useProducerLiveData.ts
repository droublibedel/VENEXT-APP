"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";

import { PRODUCER_FALLBACK_ORG_ID } from "../data/producer-industrial-fallback";

export type ProducerCommerceBffEndpoint =
  | "catalog"
  | "orders"
  | "deliveries"
  | "mail"
  | "relationships";

export type ProducerCommerceDataSource = "live" | "fallback" | "mixed";

export type ProducerCommerceEnvelope<T> = {
  dataSource: ProducerCommerceDataSource;
  fallbackUsed: boolean;
  devBadge?: boolean;
  organizationId?: string;
  payload: T;
};

export type ProducerCommerceLiveState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerCommerceDataSource;
  fallbackUsed: boolean;
  refresh: () => void;
};

const cache = new Map<string, ProducerCommerceEnvelope<unknown>>();

export function clearProducerCommerceDataCache() {
  cache.clear();
}

function cacheKey(endpoint: string, organizationId: string) {
  return `producer-commerce:${endpoint}:${organizationId}`;
}

async function fetchProducerCommerceEndpoint<T>(
  endpoint: ProducerCommerceBffEndpoint,
  organizationId: string,
  signal?: AbortSignal,
): Promise<{ envelope: ProducerCommerceEnvelope<T> | null }> {
  const url = `/api/producer/${endpoint}?organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", signal });
    if (!res.ok) return { envelope: null };
    return { envelope: (await res.json()) as ProducerCommerceEnvelope<T> };
  } catch {
    return { envelope: null };
  }
}

function useProducerCommerceEndpoint<T>(
  endpoint: ProducerCommerceBffEndpoint,
  fallback: () => ProducerCommerceEnvelope<T>,
  enabled = true,
  organizationId = PRODUCER_FALLBACK_ORG_ID,
): ProducerCommerceLiveState<T> {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const liveEnabled =
    hydrated &&
    flags.venext_bff_routes_enabled !== false &&
    flags.producer_industrial_live_data_enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<ProducerCommerceDataSource>("fallback");
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
      cache.set(cacheKey(endpoint, organizationId), fb);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
      return;
    }

    const key = cacheKey(endpoint, organizationId);
    const cached = cache.get(key) as ProducerCommerceEnvelope<T> | undefined;
    if (cached) {
      setData(cached.payload);
      setDataSource(cached.dataSource);
      setFallbackUsed(cached.fallbackUsed);
    }
    setLoading(true);
    setError(null);

    void fetchProducerCommerceEndpoint<T>(endpoint, organizationId, ac.signal).then((result) => {
      if (tick !== tickRef.current) return;
      if (result.envelope) {
        cache.set(key, result.envelope);
        setData(result.envelope.payload);
        setDataSource(result.envelope.dataSource);
        setFallbackUsed(result.envelope.fallbackUsed);
        setError(null);
        setLoading(false);
        return;
      }
      if (flags.venext_live_data_fallback_enabled === false) {
        setData(null);
        setFallbackUsed(false);
        setLoading(false);
        return;
      }
      const fb = fbRef.current();
      cache.set(key, fb);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
    });
  }, [enabled, endpoint, liveEnabled, organizationId, flags.venext_live_data_fallback_enabled]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { data, loading, error, dataSource, fallbackUsed, refresh: load };
}

const emptyEnvelope = <T,>(payload: T): ProducerCommerceEnvelope<T> => ({
  dataSource: "fallback",
  fallbackUsed: true,
  organizationId: PRODUCER_FALLBACK_ORG_ID,
  payload,
});

export function useProducerCatalogData(enabled = true) {
  return useProducerCommerceEndpoint(
    "catalog",
    () => emptyEnvelope({ organizationId: PRODUCER_FALLBACK_ORG_ID, products: [], partnerCatalogs: 0 }),
    enabled,
  );
}

export function useProducerOrdersData(enabled = true) {
  return useProducerCommerceEndpoint(
    "orders",
    () => emptyEnvelope({ organizationId: PRODUCER_FALLBACK_ORG_ID, orders: [] }),
    enabled,
  );
}

export function useProducerDeliveriesData(enabled = true) {
  return useProducerCommerceEndpoint(
    "deliveries",
    () => emptyEnvelope({ organizationId: PRODUCER_FALLBACK_ORG_ID, deliveries: [] }),
    enabled,
  );
}

export function useProducerMailData(enabled = true) {
  return useProducerCommerceEndpoint(
    "mail",
    () => emptyEnvelope({ organizationId: PRODUCER_FALLBACK_ORG_ID, threads: [] }),
    enabled,
  );
}

export function useProducerRelationshipsData(enabled = true) {
  return useProducerCommerceEndpoint(
    "relationships",
    () => emptyEnvelope({ organizationId: PRODUCER_FALLBACK_ORG_ID, relationships: [] }),
    enabled,
  );
}
