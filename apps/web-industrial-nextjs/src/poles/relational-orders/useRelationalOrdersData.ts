"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { RelationalOrdersResponse } from "@venext/shared-contracts";

import { fetchRelationalOrdersSnapshotJson } from "./relational-orders-api";

export function useRelationalOrdersData(
  organizationId: string,
  opts?: { status?: string; relationshipId?: string },
) {
  const [data, setData] = useState<RelationalOrdersResponse | null>(null);
  const dataRef = useRef<RelationalOrdersResponse | null>(null);
  dataRef.current = data;
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (orderCursor?: string) => {
      return fetchRelationalOrdersSnapshotJson<RelationalOrdersResponse>(organizationId, "summary", {
        orderCursor,
        status: opts?.status,
        relationshipId: opts?.relationshipId,
      });
    },
    [organizationId, opts?.relationshipId, opts?.status],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchPage()
      .then((d) => {
        if (cancelled) return;
        if (!d) {
          setError("commandes_relationnelles_indisponibles");
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
  }, [fetchPage]);

  const loadNextPage = useCallback(async () => {
    const cur = dataRef.current?.snapshot.diagnostics.nextOrderCursor;
    if (!cur) return;
    setLoadingMore(true);
    const next = await fetchPage(cur);
    setLoadingMore(false);
    if (!next?.snapshot) return;
    setData((prev) => {
      if (!prev) return next;
      return {
        policy: next.policy,
        snapshot: {
          ...next.snapshot,
          orders: [...prev.snapshot.orders, ...next.snapshot.orders],
          diagnostics: next.snapshot.diagnostics,
        },
      };
    });
  }, [fetchPage]);

  return {
    data,
    loading,
    loadingMore,
    error,
    loadNextPage,
    appliedStatus: opts?.status,
    appliedRelationshipId: opts?.relationshipId,
  };
}
