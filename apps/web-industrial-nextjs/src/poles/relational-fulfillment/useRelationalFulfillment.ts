"use client";

import { useCallback, useEffect, useState } from "react";

import type { RelationalFulfillmentViewResponseDto } from "@venext/shared-contracts";

import { fetchRelationalFulfillmentView } from "./relational-fulfillment-api";

export function useRelationalFulfillment(organizationId: string | null, orderId: string | null) {
  const [data, setData] = useState<RelationalFulfillmentViewResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!organizationId || !orderId) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    void fetchRelationalFulfillmentView(organizationId, orderId).then((res) => {
      setLoading(false);
      if (res.ok) {
        setData(res.data);
        setError(null);
        return;
      }
      setData(null);
      if (res.code === "relational_fulfillment_response_invalid") {
        setError("Réponse fulfillment invalide (contrat). Code : relational_fulfillment_response_invalid.");
        return;
      }
      setError("Lecture fulfillment relationnel indisponible (droits, indicateur ou commande).");
    });
  }, [organizationId, orderId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useRelationalFulfillmentRouteIds(): { organizationId: string | null; orderId: string | null } {
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
