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
  useProducerSupplyLogistics,
} from "../hooks/useProducerIndustrialLiveData";
import { buildProducerSupplyView } from "./producer-supply.viewmodel";
import type { ProducerSupplyWorkspaceView } from "./producer-supply.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerSupplyWorkspaceData(enabled = true) {
  const supply = useProducerSupplyLogistics(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const map = useProducerMapControl(enabled);
  const network = useProducerNetworkActivity(enabled);
  const commercial = useProducerCommercialNetwork(enabled);
  const intelligence = useProducerDataIntelligence(enabled);
  const marketing = useProducerMarketingActivation(enabled);
  const alerts = useProducerAlerts(enabled);

  const loading =
    supply.loading ||
    orders.loading ||
    map.loading ||
    network.loading ||
    commercial.loading ||
    intelligence.loading ||
    marketing.loading ||
    alerts.loading;

  const rawError =
    supply.error ??
    orders.error ??
    map.error ??
    network.error ??
    commercial.error ??
    intelligence.error ??
    marketing.error ??
    alerts.error;

  const dataSource = mergeSources([
    supply.dataSource,
    orders.dataSource,
    map.dataSource,
    network.dataSource,
    commercial.dataSource,
    intelligence.dataSource,
    marketing.dataSource,
    alerts.dataSource,
  ]);

  const fallbackUsed =
    supply.fallbackUsed ||
    orders.fallbackUsed ||
    map.fallbackUsed ||
    network.fallbackUsed ||
    commercial.fallbackUsed ||
    intelligence.fallbackUsed ||
    marketing.fallbackUsed ||
    alerts.fallbackUsed;

  const view: ProducerSupplyWorkspaceView | null = useMemo(() => {
    if (loading && !supply.data && !map.data) return null;
    return buildProducerSupplyView({
      supply: supply.data,
      orders: orders.data,
      map: map.data,
      network: network.data,
      commercial: commercial.data,
      intelligence: intelligence.data,
      marketing: marketing.data,
      alerts: alerts.data,
    });
  }, [
    loading,
    supply.data,
    orders.data,
    map.data,
    network.data,
    commercial.data,
    intelligence.data,
    marketing.data,
    alerts.data,
  ]);

  const error = view ? null : rawError;

  const refresh = () => {
    supply.refresh();
    orders.refresh();
    map.refresh();
    network.refresh();
    commercial.refresh();
    intelligence.refresh();
    marketing.refresh();
    alerts.refresh();
  };

  return { view, loading, error, dataSource, fallbackUsed, refresh };
}
