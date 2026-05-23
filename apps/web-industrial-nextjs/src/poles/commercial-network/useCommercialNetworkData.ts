"use client";

import type { CommercialNetworkBundleResponse } from "@venext/shared-contracts";
import { useEffect, useState } from "react";

import { fetchCommercialNetworkBundleJson, fetchCommercialNetworkJson } from "./commercial-network-api";

export type CommercialNetworkBundle = {
  overview: unknown;
  relationships: unknown;
  distributors: unknown;
  retailers: unknown;
  expansionMap: unknown;
  stabilityMatrix: unknown;
  sponsorship: unknown;
  briefing: unknown;
  interventions: unknown;
};

export function useCommercialNetworkData(organizationId: string | null, enabled: boolean) {
  const [bundle, setBundle] = useState<Partial<CommercialNetworkBundle>>({});
  const [loading, setLoading] = useState(true);
  const [hydratedVia, setHydratedVia] = useState<"bundle" | "parallel" | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setHydratedVia(null);

    void (async () => {
      let packed = await fetchCommercialNetworkBundleJson<CommercialNetworkBundleResponse>(organizationId);
      if (!packed?.version) {
        packed = await fetchCommercialNetworkBundleJson<CommercialNetworkBundleResponse>(organizationId);
      }
      if (!cancelled && packed?.version === "1") {
        setBundle({
          overview: packed.overview,
          relationships: packed.relationships,
          distributors: packed.distributors,
          retailers: packed.retailers,
          expansionMap: packed.expansionMap,
          stabilityMatrix: packed.stabilityMatrix,
          sponsorship: packed.sponsorship,
          briefing: packed.briefing,
          interventions: packed.interventions,
        });
        setHydratedVia("bundle");
        setLoading(false);
        return;
      }

      const [
        overview,
        relationships,
        distributors,
        retailers,
        expansionMap,
        stabilityMatrix,
        sponsorship,
        briefing,
        interventions,
      ] = await Promise.all([
        fetchCommercialNetworkJson("/overview", organizationId),
        fetchCommercialNetworkJson("/relationships", organizationId),
        fetchCommercialNetworkJson("/distributors", organizationId),
        fetchCommercialNetworkJson("/retailers", organizationId),
        fetchCommercialNetworkJson("/expansion-map?mode=growth", organizationId),
        fetchCommercialNetworkJson("/stability-matrix", organizationId),
        fetchCommercialNetworkJson("/sponsorship", organizationId),
        fetchCommercialNetworkJson("/briefing", organizationId),
        fetchCommercialNetworkJson("/interventions", organizationId),
      ]);
      if (cancelled) return;
      setBundle({
        overview: overview ?? undefined,
        relationships: relationships ?? undefined,
        distributors: distributors ?? undefined,
        retailers: retailers ?? undefined,
        expansionMap: expansionMap ?? undefined,
        stabilityMatrix: stabilityMatrix ?? undefined,
        sponsorship: sponsorship ?? undefined,
        briefing: briefing ?? undefined,
        interventions: interventions ?? undefined,
      });
      setHydratedVia("parallel");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, enabled]);

  return { bundle, loading, hydratedVia };
}
