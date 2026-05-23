"use client";

import { useCallback, useEffect, useState } from "react";

import {
  humanizeIndustrialCaught,
  readHumanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

import { DEMO_FINANCE_ORG } from "./constants";

export type FinancialSnapshot = Record<string, boolean>;

export function useFinancialFeatureSnapshot(organizationId: string = DEMO_FINANCE_ORG) {
  const [data, setData] = useState<FinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ organizationId });
      const r = await fetch(`/api/core/v1/financial-feature-flags/snapshot?${q.toString()}`);
      if (!r.ok) throw await readHumanizedHttpFailure(r);
      setData((await r.json()) as FinancialSnapshot);
    } catch (e) {
      setError(humanizeIndustrialCaught(e, { fallbackKey: "wallet_action_failed" }));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
