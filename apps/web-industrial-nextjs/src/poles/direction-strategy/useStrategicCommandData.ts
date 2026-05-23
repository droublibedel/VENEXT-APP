"use client";

import type { StrategicBundleResponse } from "@venext/shared-contracts";
import { useEffect, useState } from "react";

import { fetchStrategicBundleJson, fetchStrategicJson } from "./strategic-api";

export type StrategicBundle = {
  overview: unknown;
  signals: unknown;
  distribution: unknown;
  marketPressure: unknown;
  territory: unknown;
  risk: unknown;
  briefing: unknown;
  executiveQueue: unknown;
};

export function useStrategicCommandData(organizationId: string | null, enabled: boolean) {
  const [bundle, setBundle] = useState<Partial<StrategicBundle>>({});
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
      const packed = await fetchStrategicBundleJson<StrategicBundleResponse>(organizationId);
      if (!cancelled && packed?.version === "1") {
        setBundle({
          overview: packed.overview,
          signals: packed.signals,
          distribution: packed.distributionNetwork,
          marketPressure: packed.marketPressure,
          territory: packed.territoryOpportunities,
          risk: packed.riskMatrix,
          briefing: packed.executiveBriefing,
          executiveQueue: packed.executiveQueue,
        });
        setHydratedVia("bundle");
        setLoading(false);
        return;
      }

      const [
        overview,
        signals,
        distribution,
        marketPressure,
        territory,
        risk,
        briefing,
        executiveQueue,
      ] = await Promise.all([
        fetchStrategicJson("/overview", organizationId),
        fetchStrategicJson("/signals", organizationId),
        fetchStrategicJson("/distribution-network", organizationId),
        fetchStrategicJson("/market-pressure", organizationId),
        fetchStrategicJson("/territory-opportunities?mode=opportunity", organizationId),
        fetchStrategicJson("/risk-matrix", organizationId),
        fetchStrategicJson("/briefing", organizationId),
        fetchStrategicJson("/executive-queue", organizationId),
      ]);
      if (cancelled) return;
      setBundle({
        overview: overview ?? undefined,
        signals: signals ?? undefined,
        distribution: distribution ?? undefined,
        marketPressure: marketPressure ?? undefined,
        territory: territory ?? undefined,
        risk: risk ?? undefined,
        briefing: briefing ?? undefined,
        executiveQueue: executiveQueue ?? undefined,
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
