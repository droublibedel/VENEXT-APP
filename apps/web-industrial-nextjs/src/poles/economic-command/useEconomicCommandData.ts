"use client";

import { useEffect, useState } from "react";
import type { EconomicCommandBundle } from "@venext/shared-contracts";

import { buildEconomicCommandBundleFromSlices } from "./economic-command-fallback-build";
import { fetchEconomicCommandBundleJson } from "./economic-command-api";
import { loadEconomicCommandSlicesAll } from "./economic-command-sequential-load";
import type { EconomicCommandOrgResolution } from "./resolveEconomicCommandOrganizationId";

export type EconomicCommandRemoteData = {
  bundle: EconomicCommandBundle | null;
  loading: boolean;
  error: string | null;
};

export function useEconomicCommandData(resolution: EconomicCommandOrgResolution): EconomicCommandRemoteData {
  const [bundle, setBundle] = useState<EconomicCommandBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const org = resolution.organizationId;

    setLoading(true);
    setError(null);

    void (async () => {
      const direct = await fetchEconomicCommandBundleJson<EconomicCommandBundle>(org);
      if (cancelled) return;

      if (direct && direct.version === "1") {
        setBundle(direct);
        setError(null);
        setLoading(false);
        return;
      }

      setError("bundle_unavailable");
      const bag = await loadEconomicCommandSlicesAll(org);
      if (cancelled) return;

      const { bundle: rebuilt } = buildEconomicCommandBundleFromSlices(org, bag);
      setBundle(rebuilt);
      setError(null);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [resolution.organizationId]);

  return { bundle, loading, error };
}
