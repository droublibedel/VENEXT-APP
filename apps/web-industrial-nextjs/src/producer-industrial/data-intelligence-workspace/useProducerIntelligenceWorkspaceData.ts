"use client";

import { useMemo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import {
  useProducerAlerts,
  useProducerCommercialNetwork,
  useProducerDataIntelligence,
  useProducerMapControl,
  useProducerMarketingActivation,
  useProducerNetworkActivity,
  useProducerOrdersSummary,
  useProducerProducts,
  useProducerSupplyLogistics,
} from "../hooks/useProducerIndustrialLiveData";
import { buildProducerIntelligenceView } from "./producer-intelligence.viewmodel";
import type { ProducerIntelligenceWorkspaceView } from "./producer-intelligence.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerIntelligenceWorkspaceData(enabled = true) {
  const intelligence = useProducerDataIntelligence(enabled);
  const network = useProducerNetworkActivity(enabled);
  const commercial = useProducerCommercialNetwork(enabled);
  const products = useProducerProducts(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const marketing = useProducerMarketingActivation(enabled);
  const supply = useProducerSupplyLogistics(enabled);
  const map = useProducerMapControl(enabled);
  const alerts = useProducerAlerts(enabled);

  const loading =
    intelligence.loading ||
    network.loading ||
    commercial.loading ||
    products.loading ||
    orders.loading ||
    marketing.loading ||
    supply.loading ||
    map.loading ||
    alerts.loading;

  const rawError =
    intelligence.error ??
    network.error ??
    commercial.error ??
    products.error ??
    orders.error ??
    marketing.error ??
    supply.error ??
    map.error ??
    alerts.error;

  const dataSource = mergeSources([
    intelligence.dataSource,
    network.dataSource,
    commercial.dataSource,
    products.dataSource,
    orders.dataSource,
    marketing.dataSource,
    supply.dataSource,
    map.dataSource,
    alerts.dataSource,
  ]);

  const fallbackUsed =
    intelligence.fallbackUsed ||
    network.fallbackUsed ||
    commercial.fallbackUsed ||
    products.fallbackUsed ||
    orders.fallbackUsed ||
    marketing.fallbackUsed ||
    supply.fallbackUsed ||
    map.fallbackUsed ||
    alerts.fallbackUsed;

  const view: ProducerIntelligenceWorkspaceView | null = useMemo(() => {
    if (loading && !intelligence.data && !network.data) return null;
    return buildProducerIntelligenceView({
      intelligence: intelligence.data,
      network: network.data,
      commercial: commercial.data,
      products: products.data,
      orders: orders.data,
      marketing: marketing.data,
      supply: supply.data,
      map: map.data,
      alerts: alerts.data,
    });
  }, [
    loading,
    intelligence.data,
    network.data,
    commercial.data,
    products.data,
    orders.data,
    marketing.data,
    supply.data,
    map.data,
    alerts.data,
  ]);

  const error = view ? null : rawError;

  const refresh = () => {
    intelligence.refresh();
    network.refresh();
    commercial.refresh();
    products.refresh();
    orders.refresh();
    marketing.refresh();
    supply.refresh();
    map.refresh();
    alerts.refresh();
  };

  return { view, loading, error, dataSource, fallbackUsed, refresh };
}
