import { useCallback, useEffect, useRef, useState } from "react";
import { mergeTerrainFetchInit } from "commerce-terrain-profile-runtime";

import { mockGrossisteCatalog } from "../mocks/grossiste-b-mock-data";
import { resolveGrossisteBOrganizationId } from "../session/resolveGrossisteBOrganizationId";
import type { GrossisteCatalogDto, GrossisteDataSource, GrossisteLiveState } from "./grossiste-b-data.types";
import { useGrossisteFeatureFlags } from "./useGrossisteFeatureFlags";

export function useGrossisteMarketData(enabled = true) {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const liveEnabled =
    hydrated && flags.grossiste_b_live_data_enabled !== false && flags.venext_bff_routes_enabled !== false;
  const organizationId = resolveGrossisteBOrganizationId();
  const [data, setData] = useState<GrossisteCatalogDto | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<GrossisteDataSource>("fallback");
  const [fallbackUsed, setFallbackUsed] = useState(true);

  const load = useCallback(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!liveEnabled) {
      setData(mockGrossisteCatalog());
      setDataSource("fallback");
      setFallbackUsed(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    const url = `/api/market/feed?organizationId=${encodeURIComponent(organizationId)}&actorRole=GROSSISTE_B`;
    void fetch(url, mergeTerrainFetchInit({ cache: "no-store" }))
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { payload?: GrossisteCatalogDto } | null) => {
        if (body?.payload) {
          setData(body.payload);
          setDataSource("live");
          setFallbackUsed(false);
        } else {
          setData(mockGrossisteCatalog());
          setDataSource("fallback");
          setFallbackUsed(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setData(mockGrossisteCatalog());
        setDataSource("fallback");
        setFallbackUsed(true);
        setLoading(false);
      });
  }, [enabled, liveEnabled, organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, dataSource, fallbackUsed, refresh: load } satisfies GrossisteLiveState<GrossisteCatalogDto>;
}

export async function transferMarketProductToCatalogue(productId: string, organizationId: string) {
  const res = await fetch(
    `/api/market/products/${encodeURIComponent(productId)}/transfer`,
    mergeTerrainFetchInit({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, actorRole: "GROSSISTE_B" }),
    }),
  );
  if (!res.ok) throw new Error(`transfer_failed_${res.status}`);
  return res.json();
}
