"use client";

import { useMemo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import {
  useProducerAlerts,
  useProducerCommercialNetwork,
  useProducerDataIntelligence,
  useProducerFinanceCollections,
  useProducerNetworkActivity,
  useProducerOrdersSummary,
  useProducerProducts,
  useProducerSupplyLogistics,
} from "../hooks/useProducerIndustrialLiveData";
import { buildProducerCommercialMailView } from "./producer-commercial-mail.viewmodel";
import type { ProducerCommercialMailView } from "./producer-commercial-mail.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useProducerCommercialMailData(enabled = true) {
  const commercial = useProducerCommercialNetwork(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const finance = useProducerFinanceCollections(enabled);
  const network = useProducerNetworkActivity(enabled);
  const products = useProducerProducts(enabled);
  const supply = useProducerSupplyLogistics(enabled);
  const alerts = useProducerAlerts(enabled);
  const intelligence = useProducerDataIntelligence(enabled);

  const loading =
    commercial.loading ||
    orders.loading ||
    finance.loading ||
    network.loading ||
    products.loading;

  const error =
    commercial.error ?? orders.error ?? finance.error ?? network.error ?? products.error;

  const dataSource = mergeSources([
    commercial.dataSource,
    orders.dataSource,
    finance.dataSource,
    network.dataSource,
    products.dataSource,
    supply.dataSource,
    alerts.dataSource,
    intelligence.dataSource,
  ]);

  const fallbackUsed =
    commercial.fallbackUsed ||
    orders.fallbackUsed ||
    finance.fallbackUsed ||
    network.fallbackUsed ||
    products.fallbackUsed;

  const view: ProducerCommercialMailView | null = useMemo(() => {
    if (loading && !commercial.data) return null;
    return buildProducerCommercialMailView({
      commercial: commercial.data,
      orders: orders.data,
      finance: finance.data,
      network: network.data,
      products: products.data,
      alerts: alerts.data,
    });
  }, [loading, commercial.data, orders.data, finance.data, network.data, products.data, alerts.data]);

  const refresh = () => {
    commercial.refresh();
    orders.refresh();
    finance.refresh();
    network.refresh();
    products.refresh();
    supply.refresh();
    alerts.refresh();
    intelligence.refresh();
  };

  return { view, loading, error, dataSource, fallbackUsed, refresh };
}
