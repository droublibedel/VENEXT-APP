"use client";

import type { EconomicPropagationBundle } from "@venext/shared-contracts";
import { useEffect, useState } from "react";

import { fetchEconomicPropagationBundleJson, fetchEconomicPropagationJson } from "./economic-propagation-api";
import { loadEconomicPropagationSequential } from "./economic-propagation-sequential-load";

export type EconomicPropagationPartial = {
  overview: unknown;
  shocks: unknown;
  chains: unknown;
  territoryFragility: unknown;
  simulationPreview: unknown;
};

export function useEconomicPropagationData(organizationId: string | null, enabled: boolean) {
  const [bundle, setBundle] = useState<Partial<EconomicPropagationPartial>>({});
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
      let packed = await fetchEconomicPropagationBundleJson<EconomicPropagationBundle>(organizationId);
      if (!packed?.version) {
        packed = await fetchEconomicPropagationBundleJson<EconomicPropagationBundle>(organizationId);
      }
      if (!cancelled && packed?.version === "1") {
        setBundle({
          overview: packed.overview,
          shocks: packed.shocks,
          chains: packed.chains,
          territoryFragility: packed.territoryFragility,
          simulationPreview: packed.simulationPreview,
        });
        setHydratedVia("bundle");
        setLoading(false);
        return;
      }

      const fetchPanel = (suffix: string) => fetchEconomicPropagationJson(suffix, organizationId);
      const { partial } = await loadEconomicPropagationSequential(fetchPanel);
      if (cancelled) return;
      setBundle({
        overview: partial.overview,
        shocks: partial.shocks,
        chains: partial.chains,
        territoryFragility: partial.territoryFragility,
        simulationPreview: partial.simulationPreview,
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
