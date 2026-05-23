"use client";

import type { SupplyLogisticsBundleResponse } from "@venext/shared-contracts";
import { useEffect, useState } from "react";

import { fetchSupplyLogisticsBundleJson, fetchSupplyLogisticsJson } from "./supply-logistics-api";
import { loadSupplyLogisticsSequential } from "./supply-logistics-sequential-load";

export type SupplyLogisticsBundle = {
  overview: unknown;
  territoryFlow: unknown;
  shipmentHealth: unknown;
  routes: unknown;
  warehousePressure: unknown;
  loadingSupervision: unknown;
  delayRadar: unknown;
  fulfillmentStability: unknown;
  riskMatrix: unknown;
  briefing: unknown;
  interventions: unknown;
};

export function useSupplyLogisticsData(organizationId: string | null, enabled: boolean) {
  const [bundle, setBundle] = useState<Partial<SupplyLogisticsBundle>>({});
  const [loading, setLoading] = useState(true);
  const [hydratedVia, setHydratedVia] = useState<"bundle" | "sequential" | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setHydratedVia(null);

    void (async () => {
      let packed = await fetchSupplyLogisticsBundleJson<SupplyLogisticsBundleResponse>(organizationId);
      if (!packed?.version) {
        packed = await fetchSupplyLogisticsBundleJson<SupplyLogisticsBundleResponse>(organizationId);
      }
      if (!cancelled && packed?.version === "1") {
        setBundle({
          overview: packed.overview,
          territoryFlow: packed.territoryFlow,
          shipmentHealth: packed.shipmentHealth,
          routes: packed.routes,
          warehousePressure: packed.warehousePressure,
          loadingSupervision: packed.loadingSupervision,
          delayRadar: packed.delayRadar,
          fulfillmentStability: packed.fulfillmentStability,
          riskMatrix: packed.riskMatrix,
          briefing: packed.briefing,
          interventions: packed.interventions,
        });
        setHydratedVia("bundle");
        setLoading(false);
        return;
      }

      const fetchPanel = (suffix: string) => fetchSupplyLogisticsJson(suffix, organizationId);
      const { partial } = await loadSupplyLogisticsSequential(fetchPanel);
      if (cancelled) return;
      setBundle({
        overview: partial.overview,
        territoryFlow: partial.territoryFlow,
        shipmentHealth: partial.shipmentHealth,
        routes: partial.routes,
        warehousePressure: partial.warehousePressure,
        loadingSupervision: partial.loadingSupervision,
        delayRadar: partial.delayRadar,
        fulfillmentStability: partial.fulfillmentStability,
        riskMatrix: partial.riskMatrix,
        briefing: partial.briefing,
        interventions: partial.interventions,
      });
      setHydratedVia("sequential");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, enabled]);

  return { bundle, loading, hydratedVia };
}
