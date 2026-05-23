"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchProducerIndustrialEndpoint } from "../data/producer-industrial-api";
import type { ProducerIndustrialBffEndpoint } from "../data/producer-industrial-bff";
import {
  fallbackProducerAlerts,
  fallbackProducerCommercialNetwork,
  fallbackProducerDataIntelligence,
  fallbackProducerExecutive,
  fallbackProducerFinanceCollections,
  fallbackProducerMapControl,
  fallbackProducerMarketingActivation,
  fallbackProducerNetworkActivity,
  fallbackProducerOrdersSummary,
  fallbackProducerOverview,
  fallbackProducerPartners,
  fallbackProducerProducts,
  fallbackProducerSupplyLogistics,
  PRODUCER_FALLBACK_ORG_ID,
} from "../data/producer-industrial-fallback";
import type {
  ProducerAlertDto,
  ProducerCommercialNetworkDto,
  ProducerDataIntelligenceDto,
  ProducerDataSource,
  ProducerExecutiveDto,
  ProducerFinanceCollectionsDto,
  ProducerIndustrialEnvelope,
  ProducerMapControlDto,
  ProducerMarketingActivationDto,
  ProducerIndustrialOverviewDto,
  ProducerNetworkActivityDto,
  ProducerOrderSummaryDto,
  ProducerPartnerDto,
  ProducerProductTrendDto,
  ProducerSupplyLogisticsDto,
} from "../data/producer-industrial-data.types";
import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";

export type ProducerLiveDataState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
  refresh: () => void;
};

const cache = new Map<string, ProducerIndustrialEnvelope<unknown>>();

/** Test helper — clears in-memory hook cache between vitest cases. */
export function clearProducerIndustrialDataCache() {
  cache.clear();
}

function cacheKey(endpoint: string, organizationId: string) {
  return `${endpoint}:${organizationId}`;
}

function useProducerEndpoint<T>(
  endpoint: ProducerIndustrialBffEndpoint,
  fallback: () => ProducerIndustrialEnvelope<T>,
  enabled = true,
  organizationId = PRODUCER_FALLBACK_ORG_ID,
): ProducerLiveDataState<T> {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const liveEnabled = hydrated && flags.producer_industrial_live_data_enabled !== false;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<ProducerDataSource>("fallback");
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
      cache.set(cacheKey(endpoint, organizationId), fb as ProducerIndustrialEnvelope<unknown>);
      setData(fb.payload);
      setDataSource("fallback");
      setFallbackUsed(true);
      setError(null);
      setLoading(false);
      return;
    }

    const key = cacheKey(endpoint, organizationId);
    const cached = cache.get(key) as ProducerIndustrialEnvelope<T> | undefined;
    if (cached) {
      setData(cached.payload);
      setDataSource(cached.dataSource);
      setFallbackUsed(cached.fallbackUsed);
    }

    setLoading(true);
    setError(null);

    void fetchProducerIndustrialEndpoint<T>(endpoint, {
      organizationId,
      signal: ac.signal,
    }).then((result) => {
      if (tick !== tickRef.current) return;
      if (result.envelope) {
        cache.set(key, result.envelope as ProducerIndustrialEnvelope<unknown>);
        setData(result.envelope.payload);
        setDataSource(result.envelope.dataSource);
        setFallbackUsed(result.envelope.fallbackUsed);
        setError(null);
        setLoading(false);
        return;
      }

      const fb = fallbackRef.current();
      cache.set(key, fb as ProducerIndustrialEnvelope<unknown>);
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

export function useProducerOverview(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerIndustrialOverviewDto>(
    "overview",
    () => fallbackProducerOverview(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerExecutive(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerExecutiveDto>(
    "executive",
    () => fallbackProducerExecutive(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerCommercialNetwork(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerCommercialNetworkDto>(
    "commercial-network",
    () => fallbackProducerCommercialNetwork(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerMarketingActivation(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerMarketingActivationDto>(
    "marketing-activation",
    () => fallbackProducerMarketingActivation(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerSupplyLogistics(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerSupplyLogisticsDto>(
    "supply-logistics",
    () => fallbackProducerSupplyLogistics(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerFinanceCollections(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerFinanceCollectionsDto>(
    "finance-collections",
    () => fallbackProducerFinanceCollections(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerDataIntelligence(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerDataIntelligenceDto>(
    "data-intelligence",
    () => fallbackProducerDataIntelligence(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerMapControl(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerMapControlDto>(
    "map-control",
    () => fallbackProducerMapControl(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerAlerts(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerAlertDto[]>(
    "alerts",
    () => fallbackProducerAlerts(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerPartners(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerPartnerDto[]>(
    "partners",
    () => fallbackProducerPartners(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerProducts(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerProductTrendDto[]>(
    "products",
    () => fallbackProducerProducts(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerOrdersSummary(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerOrderSummaryDto>(
    "orders-summary",
    () => fallbackProducerOrdersSummary(organizationId),
    enabled,
    organizationId,
  );
}

export function useProducerNetworkActivity(enabled = true, organizationId?: string) {
  return useProducerEndpoint<ProducerNetworkActivityDto>(
    "network-activity",
    () => fallbackProducerNetworkActivity(organizationId),
    enabled,
    organizationId,
  );
}
