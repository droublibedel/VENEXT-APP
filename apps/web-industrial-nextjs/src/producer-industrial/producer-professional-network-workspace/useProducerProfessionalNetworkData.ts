"use client";

import { useMemo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import {
  useProducerCommercialNetwork,
  useProducerFinanceCollections,
  useProducerNetworkActivity,
  useProducerOrdersSummary,
  useProducerPartners,
} from "../hooks/useProducerIndustrialLiveData";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerProfessionalNetworkData(enabled = true) {
  const commercial = useProducerCommercialNetwork(enabled);
  const partners = useProducerPartners(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const finance = useProducerFinanceCollections(enabled);
  const network = useProducerNetworkActivity(enabled);

  const loading =
    commercial.loading || partners.loading || orders.loading || finance.loading || network.loading;

  const error =
    commercial.error ?? partners.error ?? orders.error ?? finance.error ?? network.error;

  const dataSource = mergeSources([
    commercial.dataSource,
    partners.dataSource,
    orders.dataSource,
    finance.dataSource,
    network.dataSource,
  ]);

  const fallbackUsed =
    commercial.fallbackUsed ||
    partners.fallbackUsed ||
    orders.fallbackUsed ||
    finance.fallbackUsed ||
    network.fallbackUsed;

  const refresh = () => {
    commercial.refresh();
    partners.refresh();
    orders.refresh();
    finance.refresh();
    network.refresh();
  };

  return useMemo(
    () => ({
      commercial: commercial.data,
      partners: partners.data,
      orders: orders.data,
      finance: finance.data,
      network: network.data,
      loading,
      error,
      dataSource,
      fallbackUsed,
      refresh,
    }),
    [
      commercial.data,
      partners.data,
      orders.data,
      finance.data,
      network.data,
      loading,
      error,
      dataSource,
      fallbackUsed,
    ],
  );
}
