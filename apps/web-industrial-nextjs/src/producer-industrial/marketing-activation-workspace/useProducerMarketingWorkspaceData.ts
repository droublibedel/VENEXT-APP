"use client";

import { useMemo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import {
  useProducerCommercialNetwork,
  useProducerDataIntelligence,
  useProducerMapControl,
  useProducerMarketingActivation,
  useProducerNetworkActivity,
  useProducerOrdersSummary,
  useProducerProducts,
  useProducerSupplyLogistics,
} from "../hooks/useProducerIndustrialLiveData";
import { buildProducerMarketingView } from "./producer-marketing.viewmodel";
import type { ProducerMarketingWorkspaceView } from "./producer-marketing.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerMarketingWorkspaceData(enabled = true) {
  const marketing = useProducerMarketingActivation(enabled);
  const commercial = useProducerCommercialNetwork(enabled);
  const network = useProducerNetworkActivity(enabled);
  const products = useProducerProducts(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const map = useProducerMapControl(enabled);
  const intelligence = useProducerDataIntelligence(enabled);
  const supply = useProducerSupplyLogistics(enabled);

  const loading =
    marketing.loading ||
    commercial.loading ||
    network.loading ||
    products.loading ||
    orders.loading ||
    map.loading ||
    intelligence.loading ||
    supply.loading;

  const rawError =
    marketing.error ??
    commercial.error ??
    network.error ??
    products.error ??
    orders.error ??
    map.error ??
    intelligence.error ??
    supply.error;

  const dataSource = mergeSources([
    marketing.dataSource,
    commercial.dataSource,
    network.dataSource,
    products.dataSource,
    orders.dataSource,
    map.dataSource,
    intelligence.dataSource,
    supply.dataSource,
  ]);

  const fallbackUsed =
    marketing.fallbackUsed ||
    commercial.fallbackUsed ||
    network.fallbackUsed ||
    products.fallbackUsed ||
    orders.fallbackUsed ||
    map.fallbackUsed ||
    intelligence.fallbackUsed ||
    supply.fallbackUsed;

  const view: ProducerMarketingWorkspaceView | null = useMemo(() => {
    if (loading && !marketing.data && !products.data) return null;
    return buildProducerMarketingView({
      marketing: marketing.data,
      commercial: commercial.data,
      network: network.data,
      products: products.data,
      orders: orders.data,
      map: map.data,
      supply: supply.data,
      intelligence: intelligence.data,
    });
  }, [
    loading,
    marketing.data,
    commercial.data,
    network.data,
    products.data,
    orders.data,
    map.data,
    supply.data,
    intelligence.data,
  ]);

  const error = view ? null : rawError;

  const refresh = () => {
    marketing.refresh();
    commercial.refresh();
    network.refresh();
    products.refresh();
    orders.refresh();
    map.refresh();
    intelligence.refresh();
    supply.refresh();
  };

  return { view, loading, error, dataSource, fallbackUsed, refresh };
}
