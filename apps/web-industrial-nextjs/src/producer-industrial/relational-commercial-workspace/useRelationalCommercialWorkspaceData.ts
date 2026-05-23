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
  useProducerPartners,
  useProducerProducts,
  useProducerSupplyLogistics,
} from "../hooks/useProducerIndustrialLiveData";
import { buildRelationalCommercialView } from "./relational-commercial-view-model";
import type { RelationalCommercialWorkspaceView } from "./relational-commercial-workspace.types";

function mergeSources(sources: ProducerDataSource[]): ProducerDataSource {
  const set = new Set(sources);
  if (set.size === 1) return sources[0] ?? "fallback";
  return "mixed";
}

export function useRelationalCommercialWorkspaceData(enabled = true) {
  const commercial = useProducerCommercialNetwork(enabled);
  const partners = useProducerPartners(enabled);
  const orders = useProducerOrdersSummary(enabled);
  const map = useProducerMapControl(enabled);
  const supply = useProducerSupplyLogistics(enabled);
  const marketing = useProducerMarketingActivation(enabled);
  const products = useProducerProducts(enabled);
  const intelligence = useProducerDataIntelligence(enabled);
  const network = useProducerNetworkActivity(enabled);

  const loading =
    commercial.loading ||
    partners.loading ||
    orders.loading ||
    map.loading ||
    supply.loading ||
    marketing.loading ||
    products.loading ||
    intelligence.loading ||
    network.loading;

  const rawError =
    commercial.error ??
    partners.error ??
    orders.error ??
    map.error ??
    supply.error ??
    marketing.error ??
    products.error ??
    intelligence.error ??
    network.error;

  const dataSource = mergeSources([
    commercial.dataSource,
    partners.dataSource,
    orders.dataSource,
    map.dataSource,
    supply.dataSource,
    marketing.dataSource,
    products.dataSource,
    intelligence.dataSource,
    network.dataSource,
  ]);

  const fallbackUsed =
    commercial.fallbackUsed ||
    partners.fallbackUsed ||
    orders.fallbackUsed ||
    map.fallbackUsed ||
    supply.fallbackUsed ||
    marketing.fallbackUsed ||
    products.fallbackUsed ||
    intelligence.fallbackUsed ||
    network.fallbackUsed;

  const view: RelationalCommercialWorkspaceView | null = useMemo(() => {
    if (loading && !commercial.data && !partners.data) return null;
    return buildRelationalCommercialView({
      commercial: commercial.data,
      partners: partners.data,
      orders: orders.data,
      map: map.data,
      supply: supply.data,
      marketing: marketing.data,
      products: products.data,
      intelligence: intelligence.data,
      network: network.data,
    });
  }, [
    loading,
    commercial.data,
    partners.data,
    orders.data,
    map.data,
    supply.data,
    marketing.data,
    products.data,
    intelligence.data,
    network.data,
  ]);

  const refresh = () => {
    commercial.refresh();
    partners.refresh();
    orders.refresh();
    map.refresh();
    supply.refresh();
    marketing.refresh();
    products.refresh();
    intelligence.refresh();
    network.refresh();
  };

  const error = view ? null : rawError;

  return {
    view,
    loading,
    error,
    dataSource,
    fallbackUsed,
    refresh,
  };
}
