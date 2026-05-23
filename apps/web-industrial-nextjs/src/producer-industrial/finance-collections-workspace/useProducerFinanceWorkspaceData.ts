"use client";

import { useMemo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import {
  useProducerAlerts,
  useProducerCommercialNetwork,
  useProducerDataIntelligence,
  useProducerFinanceCollections,
  useProducerMapControl,
  useProducerNetworkActivity,
  useProducerOrdersSummary,
  useProducerSupplyLogistics,
} from "../hooks/useProducerIndustrialLiveData";
import { buildProducerFinanceView } from "./producer-finance.viewmodel";
import type { ProducerFinanceWorkspaceView } from "./producer-finance.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerFinanceWorkspaceData(enabled = true) {
  const finance = useProducerFinanceCollections(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const commercial = useProducerCommercialNetwork(enabled);
  const network = useProducerNetworkActivity(enabled);
  const map = useProducerMapControl(enabled);
  const alerts = useProducerAlerts(enabled);
  const intelligence = useProducerDataIntelligence(enabled);
  const supply = useProducerSupplyLogistics(enabled);

  const loading =
    finance.loading ||
    orders.loading ||
    commercial.loading ||
    network.loading ||
    map.loading ||
    alerts.loading ||
    intelligence.loading ||
    supply.loading;

  const rawError =
    finance.error ??
    orders.error ??
    commercial.error ??
    network.error ??
    map.error ??
    alerts.error ??
    intelligence.error ??
    supply.error;

  const dataSource = mergeSources([
    finance.dataSource,
    orders.dataSource,
    commercial.dataSource,
    network.dataSource,
    map.dataSource,
    alerts.dataSource,
    intelligence.dataSource,
    supply.dataSource,
  ]);

  const fallbackUsed =
    finance.fallbackUsed ||
    orders.fallbackUsed ||
    commercial.fallbackUsed ||
    network.fallbackUsed ||
    map.fallbackUsed ||
    alerts.fallbackUsed ||
    intelligence.fallbackUsed ||
    supply.fallbackUsed;

  const view: ProducerFinanceWorkspaceView | null = useMemo(() => {
    if (loading && !finance.data && !commercial.data) return null;
    return buildProducerFinanceView({
      finance: finance.data,
      orders: orders.data,
      commercial: commercial.data,
      network: network.data,
      map: map.data,
      alerts: alerts.data,
      intelligence: intelligence.data,
      supply: supply.data,
    });
  }, [
    loading,
    finance.data,
    orders.data,
    commercial.data,
    network.data,
    map.data,
    alerts.data,
    intelligence.data,
    supply.data,
  ]);

  const error = view ? null : rawError;

  const refresh = () => {
    finance.refresh();
    orders.refresh();
    commercial.refresh();
    network.refresh();
    map.refresh();
    alerts.refresh();
    intelligence.refresh();
    supply.refresh();
  };

  return { view, loading, error, dataSource, fallbackUsed, refresh };
}
