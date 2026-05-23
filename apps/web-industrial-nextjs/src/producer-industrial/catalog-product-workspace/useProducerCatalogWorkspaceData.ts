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
import { buildProducerCatalogView } from "./producer-catalog.viewmodel";
import type { ProducerCatalogWorkspaceView } from "./producer-catalog.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerCatalogWorkspaceData(enabled = true) {
  const products = useProducerProducts(enabled);
  const commercial = useProducerCommercialNetwork(enabled);
  const marketing = useProducerMarketingActivation(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const map = useProducerMapControl(enabled);
  const network = useProducerNetworkActivity(enabled);
  const intelligence = useProducerDataIntelligence(enabled);
  const supply = useProducerSupplyLogistics(enabled);

  const loading =
    products.loading ||
    commercial.loading ||
    marketing.loading ||
    orders.loading ||
    map.loading ||
    network.loading ||
    intelligence.loading ||
    supply.loading;

  const rawError =
    products.error ??
    commercial.error ??
    marketing.error ??
    orders.error ??
    map.error ??
    network.error ??
    intelligence.error ??
    supply.error;

  const dataSource = mergeSources([
    products.dataSource,
    commercial.dataSource,
    marketing.dataSource,
    orders.dataSource,
    map.dataSource,
    network.dataSource,
    intelligence.dataSource,
    supply.dataSource,
  ]);

  const fallbackUsed =
    products.fallbackUsed ||
    commercial.fallbackUsed ||
    marketing.fallbackUsed ||
    orders.fallbackUsed ||
    map.fallbackUsed ||
    network.fallbackUsed ||
    intelligence.fallbackUsed ||
    supply.fallbackUsed;

  const view: ProducerCatalogWorkspaceView | null = useMemo(() => {
    if (loading && !products.data && !marketing.data) return null;
    return buildProducerCatalogView({
      products: products.data,
      commercial: commercial.data,
      marketing: marketing.data,
      orders: orders.data,
      supply: supply.data,
      intelligence: intelligence.data,
      network: network.data,
    });
  }, [
    loading,
    products.data,
    commercial.data,
    marketing.data,
    orders.data,
    supply.data,
    intelligence.data,
    network.data,
  ]);

  const error = view ? null : rawError;

  const refresh = () => {
    products.refresh();
    commercial.refresh();
    marketing.refresh();
    orders.refresh();
    map.refresh();
    network.refresh();
    intelligence.refresh();
    supply.refresh();
  };

  return { view, map: map.data, loading, error, dataSource, fallbackUsed, refresh };
}
