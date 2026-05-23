"use client";

import { useCallback, useEffect, useState } from "react";

import {
  humanizeIndustrialCaught,
  readHumanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

import type { LivingCatalogResponse } from "../types";

export function useLivingCatalog(relationshipId: string, viewerOrganizationId?: string) {
  const [data, setData] = useState<LivingCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!relationshipId) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ relationshipId });
      if (viewerOrganizationId) q.set("viewerOrganizationId", viewerOrganizationId);
      const r = await fetch(`/api/core/v1/product-intelligence/living-catalog?${q.toString()}`);
      if (!r.ok) throw await readHumanizedHttpFailure(r);
      setData((await r.json()) as LivingCatalogResponse);
    } catch (e) {
      setError(humanizeIndustrialCaught(e, { fallbackKey: "catalog_unavailable" }));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [relationshipId, viewerOrganizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
