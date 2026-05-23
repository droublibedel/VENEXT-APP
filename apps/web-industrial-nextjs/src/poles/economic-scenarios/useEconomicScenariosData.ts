"use client";

import { useEffect, useState } from "react";
import type { EconomicScenariosBundle } from "@venext/shared-contracts";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { fetchEconomicScenariosBundleJson } from "./economic-scenarios-api";
import type { EconomicScenariosOrgResolution } from "./resolveEconomicScenariosOrganizationId";

export function useEconomicScenariosData(organizationResolution: EconomicScenariosOrgResolution) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const [bundle, setBundle] = useState<EconomicScenariosBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || flags.economic_scenarios_enabled === false) {
      setBundle(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const raw = await fetchEconomicScenariosBundleJson<EconomicScenariosBundle>(organizationResolution.organizationId);
        if (cancelled) return;
        setBundle(raw && raw.version === "1" ? raw : null);
        setError(raw ? null : "bundle_unavailable");
      } catch {
        if (!cancelled) {
          setBundle(null);
          setError("fetch_failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, flags.economic_scenarios_enabled, organizationResolution.organizationId]);

  return { bundle, loading, error, hydrated, flags };
}
