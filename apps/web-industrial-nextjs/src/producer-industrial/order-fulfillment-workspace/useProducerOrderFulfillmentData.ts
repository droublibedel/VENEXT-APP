"use client";

import { useMemo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import {
  useProducerAlerts,
  useProducerCommercialNetwork,
  useProducerDataIntelligence,
  useProducerExecutive,
  useProducerMapControl,
  useProducerNetworkActivity,
  useProducerOrdersSummary,
  useProducerSupplyLogistics,
} from "../hooks/useProducerIndustrialLiveData";
import { buildOrderFulfillmentView } from "./producer-order-fulfillment.viewmodel";
import type { ProducerOrderFulfillmentView } from "./producer-order-fulfillment.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerOrderFulfillmentData(enabled = true) {
  const orders = useProducerOrdersSummary(enabled);
  const network = useProducerNetworkActivity(enabled);
  const supply = useProducerSupplyLogistics(enabled);
  const map = useProducerMapControl(enabled);
  const alerts = useProducerAlerts(enabled);
  const commercial = useProducerCommercialNetwork(enabled);
  const intelligence = useProducerDataIntelligence(enabled);
  const executive = useProducerExecutive(enabled);

  const loading =
    orders.loading ||
    network.loading ||
    supply.loading ||
    map.loading ||
    alerts.loading ||
    commercial.loading ||
    intelligence.loading ||
    executive.loading;

  const rawError =
    orders.error ??
    network.error ??
    supply.error ??
    map.error ??
    alerts.error ??
    commercial.error ??
    intelligence.error ??
    executive.error;

  const dataSource = mergeSources([
    orders.dataSource,
    network.dataSource,
    supply.dataSource,
    map.dataSource,
    alerts.dataSource,
    commercial.dataSource,
    intelligence.dataSource,
    executive.dataSource,
  ]);

  const fallbackUsed =
    orders.fallbackUsed ||
    network.fallbackUsed ||
    supply.fallbackUsed ||
    map.fallbackUsed ||
    alerts.fallbackUsed ||
    commercial.fallbackUsed ||
    intelligence.fallbackUsed ||
    executive.fallbackUsed;

  const view: ProducerOrderFulfillmentView | null = useMemo(() => {
    if (loading && !orders.data && !commercial.data) return null;
    return buildOrderFulfillmentView({
      orders: orders.data,
      network: network.data,
      supply: supply.data,
      map: map.data,
      alerts: alerts.data,
      commercial: commercial.data,
      intelligence: intelligence.data,
      executive: executive.data,
    });
  }, [
    loading,
    orders.data,
    network.data,
    supply.data,
    map.data,
    alerts.data,
    commercial.data,
    intelligence.data,
    executive.data,
  ]);

  const error = view ? null : rawError;

  const refresh = () => {
    orders.refresh();
    network.refresh();
    supply.refresh();
    map.refresh();
    alerts.refresh();
    commercial.refresh();
    intelligence.refresh();
    executive.refresh();
  };

  return { view, loading, error, dataSource, fallbackUsed, refresh };
}
