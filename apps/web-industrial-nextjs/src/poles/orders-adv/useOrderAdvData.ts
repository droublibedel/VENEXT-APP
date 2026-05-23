"use client";

import type { OrderAdvBundleResponse } from "@venext/shared-contracts";
import { useEffect, useState } from "react";

import { fetchOrderAdvBundleJson, fetchOrderAdvJson } from "./order-adv-api";
import { loadOrderAdvSequential } from "./order-adv-sequential-load";

export type OrderAdvBundle = {
  overview: unknown;
  conversationalCommerce: unknown;
  negotiations: unknown;
  orderPressure: unknown;
  groupBuying: unknown;
  reservations: unknown;
  deliveryPriority: unknown;
  advCoordination: unknown;
  riskMatrix: unknown;
  briefing: unknown;
  interventions: unknown;
};

export function useOrderAdvData(organizationId: string | null, enabled: boolean) {
  const [bundle, setBundle] = useState<Partial<OrderAdvBundle>>({});
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
      let packed = await fetchOrderAdvBundleJson<OrderAdvBundleResponse>(organizationId);
      if (!packed?.version) {
        packed = await fetchOrderAdvBundleJson<OrderAdvBundleResponse>(organizationId);
      }
      if (!cancelled && packed?.version === "1") {
        setBundle({
          overview: packed.overview,
          conversationalCommerce: packed.conversationalCommerce,
          negotiations: packed.negotiations,
          orderPressure: packed.orderPressure,
          groupBuying: packed.groupBuying,
          reservations: packed.reservations,
          deliveryPriority: packed.deliveryPriority,
          advCoordination: packed.advCoordination,
          riskMatrix: packed.riskMatrix,
          briefing: packed.briefing,
          interventions: packed.interventions,
        });
        setHydratedVia("bundle");
        setLoading(false);
        return;
      }

      const fetchPanel = (suffix: string) => fetchOrderAdvJson(suffix, organizationId);
      const { partial } = await loadOrderAdvSequential(fetchPanel);
      if (cancelled) return;
      setBundle({
        overview: partial.overview,
        conversationalCommerce: partial.conversationalCommerce,
        negotiations: partial.negotiations,
        orderPressure: partial.orderPressure,
        groupBuying: partial.groupBuying,
        reservations: partial.reservations,
        deliveryPriority: partial.deliveryPriority,
        advCoordination: partial.advCoordination,
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
