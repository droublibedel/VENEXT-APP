"use client";

import { useCallback, useEffect, useState } from "react";

import type { CommercialRelationshipGraphBundle } from "@venext/shared-contracts";

import { fetchCommercialRelationshipGraphBundleJson } from "./commercial-relationship-graph-api";

/** Instruction 19.1 — bundle-first: single GET /bundle; slices use same materialization on server. */
export function useCommercialRelationshipGraphData(organizationId: string) {
  const [bundle, setBundle] = useState<CommercialRelationshipGraphBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const b = await fetchCommercialRelationshipGraphBundleJson<CommercialRelationshipGraphBundle>(organizationId, "summary");
    if (!b) {
      setError("Le graphe relationnel n’est pas disponible pour le moment.");
      setBundle(null);
      setLoading(false);
      return;
    }
    setBundle(b);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { bundle, loading, error, reload: load };
}
