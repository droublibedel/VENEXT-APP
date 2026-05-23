"use client";

import { useEffect, useState } from "react";
import type { EconomicCoordinationBundle } from "@venext/shared-contracts";

import { fetchEconomicCoordinationBundleJson } from "./economic-coordination-api";
import type { EconomicCoordinationOrgResolution } from "./resolveEconomicCoordinationOrganizationId";

export type EconomicCoordinationRemoteData = {
  bundle: EconomicCoordinationBundle | null;
  loading: boolean;
  error: string | null;
};

export function useEconomicCoordinationData(resolution: EconomicCoordinationOrgResolution): EconomicCoordinationRemoteData {
  const [bundle, setBundle] = useState<EconomicCoordinationBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchEconomicCoordinationBundleJson<EconomicCoordinationBundle>(resolution.organizationId).then((b) => {
      if (cancelled) return;
      if (!b || b.version !== "1") {
        setBundle(null);
        setError("bundle_unavailable");
      } else {
        setBundle(b);
        setError(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [resolution.organizationId]);

  return { bundle, loading, error };
}
