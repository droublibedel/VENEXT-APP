"use client";

import { useEffect, useState } from "react";

import type { RelationalCatalogResponse } from "@venext/shared-contracts";

import { fetchRelationalCatalogSnapshotJson } from "./relational-catalog-api";

export function useRelationalCatalogData(organizationId: string) {
  const [data, setData] = useState<RelationalCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchRelationalCatalogSnapshotJson<RelationalCatalogResponse>(organizationId, "summary")
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setError("catalogue_relationnel_indisponible");
          setData(null);
        } else {
          setData(d);
          setError(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return { data, loading, error };
}
