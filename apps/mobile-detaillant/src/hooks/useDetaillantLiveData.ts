import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildProfileScopedCacheKey,
  mergeTerrainFetchInit,
  registerProfileCachePurgeHandler,
} from "commerce-terrain-profile-runtime";

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

registerProfileCachePurgeHandler((profile) => {
  if (profile === "detaillant") clearDetaillantDataCache();
});

function cacheKey(endpoint: string, organizationId: string) {
  return buildProfileScopedCacheKey("detaillant", endpoint === "home" ? "home" : endpoint === "products" ? "products" : endpoint === "orders" ? "orders" : "network", organizationId);
}

async function fetchDetaillantEndpoint<T>(
  endpoint: DetaillantBffEndpoint,
  organizationId: string,
  signal?: AbortSignal,
): Promise<{ envelope: DetaillantEnvelope<T> | null; error: string | null }> {
  const url = `/api/detaillant/${endpoint}?organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const res = await fetch(url, mergeTerrainFetchInit({ cache: "no-store", signal }));
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
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const liveEnabled =
    hydrated &&
    flags.detaillant_live_data_enabled !== false &&
    flags.venext_bff_routes_enabled !== false;
  const organizationId = resolveDetaillantOrganizationId();
  const [data, setData] = useState<DetaillantProductsDto | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DetaillantDataSource>("fallback");
  const [fallbackUsed, setFallbackUsed] = useState(true);

  const load = useCallback(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!liveEnabled) {
      setData(mockDetaillantProducts());
      setDataSource("fallback");
      setFallbackUsed(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    const url = `/api/market/feed?organizationId=${encodeURIComponent(organizationId)}&actorRole=DETAILLANT`;
    void fetch(url, mergeTerrainFetchInit({ cache: "no-store" }))
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { payload?: { products?: Array<{ id: string; name: string; category: string; basePrice?: number | null; supplierName?: string }> } } | null) => {
        const marketProducts = body?.payload?.products ?? [];
        if (marketProducts.length > 0) {
          const mapped: DetaillantProductsDto = {
            organizationId,
            products: marketProducts.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              availability: "available" as const,
              priceLabel: p.basePrice != null ? `${p.basePrice} FCFA` : "Sur demande",
              city: p.supplierName ?? "Fournisseur",
            })),
            popularIds: marketProducts.slice(0, 2).map((p) => p.id),
            promotions: [],
          };
          setData(mapped);
          setDataSource("live");
          setFallbackUsed(false);
        } else {
          setData(mockDetaillantProducts());
          setDataSource("fallback");
          setFallbackUsed(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setData(mockDetaillantProducts());
        setDataSource("fallback");
        setFallbackUsed(true);
        setLoading(false);
      });
  }, [enabled, liveEnabled, organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, dataSource, fallbackUsed, refresh: load };
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
