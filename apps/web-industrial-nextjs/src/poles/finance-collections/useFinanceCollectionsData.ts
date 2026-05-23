"use client";

import type { FinanceCollectionsBundleResponse } from "@venext/shared-contracts";
import { useEffect, useState } from "react";

import { fetchFinanceCollectionsBundleJson, fetchFinanceCollectionsJson } from "./finance-collections-api";
import { loadFinanceCollectionsSequential } from "./finance-collections-sequential-load";

export type FinanceCollectionsBundle = {
  overview: unknown;
  paymentPressure: unknown;
  receivablesHealth: unknown;
  paymentBehavior: unknown;
  walletLiquidity: unknown;
  creditRisk: unknown;
  cashflow: unknown;
  paymentAnomalies: unknown;
  collectionPriorities: unknown;
  briefing: unknown;
  interventions: unknown;
};

export function useFinanceCollectionsData(organizationId: string | null, enabled: boolean) {
  const [bundle, setBundle] = useState<Partial<FinanceCollectionsBundle>>({});
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
      let packed = await fetchFinanceCollectionsBundleJson<FinanceCollectionsBundleResponse>(organizationId);
      if (!packed?.version) {
        packed = await fetchFinanceCollectionsBundleJson<FinanceCollectionsBundleResponse>(organizationId);
      }
      if (!cancelled && packed?.version === "1") {
        setBundle({
          overview: packed.overview,
          paymentPressure: packed.paymentPressure,
          receivablesHealth: packed.receivablesHealth,
          paymentBehavior: packed.paymentBehavior,
          walletLiquidity: packed.walletLiquidity,
          creditRisk: packed.creditRisk,
          cashflow: packed.cashflow,
          paymentAnomalies: packed.paymentAnomalies,
          collectionPriorities: packed.collectionPriorities,
          briefing: packed.briefing,
          interventions: packed.interventions,
        });
        setHydratedVia("bundle");
        setLoading(false);
        return;
      }

      const fetchPanel = (suffix: string) => fetchFinanceCollectionsJson(suffix, organizationId);
      const { partial } = await loadFinanceCollectionsSequential(fetchPanel);
      if (cancelled) return;
      setBundle({
        overview: partial.overview,
        paymentPressure: partial.paymentPressure,
        receivablesHealth: partial.receivablesHealth,
        paymentBehavior: partial.paymentBehavior,
        walletLiquidity: partial.walletLiquidity,
        creditRisk: partial.creditRisk,
        cashflow: partial.cashflow,
        paymentAnomalies: partial.paymentAnomalies,
        collectionPriorities: partial.collectionPriorities,
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
