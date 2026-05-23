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
import { buildProducerTerritoryView } from "./producer-territory.viewmodel";
import type { ProducerTerritoryWorkspaceView } from "./producer-territory.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerTerritoryWorkspaceData(enabled = true) {
  const commercial = useProducerCommercialNetwork(enabled);
  const network = useProducerNetworkActivity(enabled);
  const map = useProducerMapControl(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const supply = useProducerSupplyLogistics(enabled);
  const products = useProducerProducts(enabled);
  const intelligence = useProducerDataIntelligence(enabled);
  const marketing = useProducerMarketingActivation(enabled);

  const loading =
    commercial.loading ||
    network.loading ||
    map.loading ||
    orders.loading ||
    supply.loading ||
    products.loading ||
    intelligence.loading ||
    marketing.loading;

  const rawError =
    commercial.error ??
    network.error ??
    map.error ??
    orders.error ??
    supply.error ??
    products.error ??
    intelligence.error ??
    marketing.error;

  const dataSource = mergeSources([
    commercial.dataSource,
    network.dataSource,
    map.dataSource,
    orders.dataSource,
    supply.dataSource,
    products.dataSource,
    intelligence.dataSource,
    marketing.dataSource,
  ]);

  const fallbackUsed =
    commercial.fallbackUsed ||
    network.fallbackUsed ||
    map.fallbackUsed ||
    orders.fallbackUsed ||
    supply.fallbackUsed ||
    products.fallbackUsed ||
    intelligence.fallbackUsed ||
    marketing.fallbackUsed;

  const view: ProducerTerritoryWorkspaceView | null = useMemo(() => {
    if (loading && !commercial.data && !map.data) return null;
    return buildProducerTerritoryView({
      commercial: commercial.data,
      network: network.data,
      map: map.data,
      orders: orders.data,
      supply: supply.data,
      intelligence: intelligence.data,
    });
  }, [
    loading,
    commercial.data,
    network.data,
    map.data,
    orders.data,
    supply.data,
    intelligence.data,
  ]);

  const error = view ? null : rawError;

  const refresh = () => {
    commercial.refresh();
    network.refresh();
    map.refresh();
    orders.refresh();
    supply.refresh();
    products.refresh();
    intelligence.refresh();
    marketing.refresh();
  };

  return { view, loading, error, dataSource, fallbackUsed, refresh };
}
