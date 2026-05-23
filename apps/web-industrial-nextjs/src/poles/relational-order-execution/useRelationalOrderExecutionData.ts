"use client";

import { useEffect, useState } from "react";

import type { RelationalOrderExecutionViewResponseDto } from "@venext/shared-contracts";

import { fetchRelationalOrderExecutionView } from "./relational-order-execution-api";

export function useRelationalOrderExecutionData(organizationId: string | null, orderId: string | null) {
  const [data, setData] = useState<RelationalOrderExecutionViewResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId || !orderId) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchRelationalOrderExecutionView(organizationId, orderId).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok === true) {
        setData(res.data);
        setError(null);
        return;
      }
      setData(null);
      if (res.code === "relational_order_execution_response_invalid") {
        setError("Réponse exécution invalide (contrat). Code : relational_order_execution_response_invalid.");
        return;
      }
      setError("Lecture exécution indisponible (droits, indicateur ou commande).");
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, orderId]);

  return { data, loading, error };
}

export function useRelationalOrderExecutionRouteIds(): { organizationId: string | null; orderId: string | null } {
  const [ids, setIds] = useState<{ organizationId: string | null; orderId: string | null }>({
    organizationId: null,
    orderId: null,
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setIds({ organizationId: sp.get("organizationId"), orderId: sp.get("orderId") });
  }, []);
  return ids;
}
