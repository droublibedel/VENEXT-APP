"use client";

import { useCallback, useEffect, useState } from "react";

import {
  humanizeIndustrialCaught,
  readHumanizedHttpFailure,
} from "@/errors/industrial-humanized-feedback";

import type { SegmentedPartnerFeedResponse } from "../types";

export function useSegmentedPartnerFeed(
  relationshipId: string,
  viewerOrganizationId?: string,
  supplierOrganizationId?: string | null,
) {
  const [data, setData] = useState<SegmentedPartnerFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!relationshipId) return;
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ relationshipId });
      if (viewerOrganizationId) q.set("viewerOrganizationId", viewerOrganizationId);
      if (supplierOrganizationId) q.set("supplierOrganizationId", supplierOrganizationId);
      const r = await fetch(`/api/core/v1/relational-commerce/catalog/segmented-feed?${q.toString()}`);
      if (!r.ok) throw await readHumanizedHttpFailure(r);
      setData((await r.json()) as SegmentedPartnerFeedResponse);
    } catch (e) {
      setError(humanizeIndustrialCaught(e, { fallbackKey: "catalog_unavailable" }));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [relationshipId, viewerOrganizationId, supplierOrganizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
