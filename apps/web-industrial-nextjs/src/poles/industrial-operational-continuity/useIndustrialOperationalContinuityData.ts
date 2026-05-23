"use client";

import { useEffect, useState } from "react";
import type { IndustrialOperationalContinuityBundle } from "@venext/shared-contracts";

import { fetchIndustrialOperationalContinuityBundleJson } from "./industrial-operational-continuity-api";
import type { IndustrialOperationalContinuityOrgResolution } from "./resolveIndustrialOperationalContinuityOrganizationId";

export const INDUSTRIAL_OPERATIONAL_CONTINUITY_BUNDLE_ERROR_FR =
  "Mode dégradé indisponible — recharger le bundle de continuité.";

export type IndustrialOperationalContinuityRemoteData = {
  bundle: IndustrialOperationalContinuityBundle | null;
  loading: boolean;
  error: string | null;
};

export function useIndustrialOperationalContinuityData(
  resolution: IndustrialOperationalContinuityOrgResolution,
): IndustrialOperationalContinuityRemoteData {
  const [bundle, setBundle] = useState<IndustrialOperationalContinuityBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchIndustrialOperationalContinuityBundleJson<IndustrialOperationalContinuityBundle>(resolution.organizationId).then(
      (b) => {
        if (cancelled) return;
        if (!b || b.version !== "1") {
          setBundle(null);
          setError(INDUSTRIAL_OPERATIONAL_CONTINUITY_BUNDLE_ERROR_FR);
        } else {
          setBundle(b);
          setError(null);
        }
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [resolution.organizationId]);

  return { bundle, loading, error };
}
