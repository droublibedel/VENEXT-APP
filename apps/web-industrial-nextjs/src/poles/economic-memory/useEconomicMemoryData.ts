"use client";

import { useEffect, useState } from "react";
import type { EconomicMemoryBundle } from "@venext/shared-contracts";

import { fetchEconomicMemoryBundleJson } from "./economic-memory-api";

export function useEconomicMemoryData(organizationId: string | undefined, enabled: boolean) {
  const [bundle, setBundle] = useState<EconomicMemoryBundle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId || !enabled) {
      setBundle(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchEconomicMemoryBundleJson<EconomicMemoryBundle>(organizationId).then((b) => {
      if (cancelled) return;
      setBundle(b);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, enabled]);

  return { bundle, loading };
}
