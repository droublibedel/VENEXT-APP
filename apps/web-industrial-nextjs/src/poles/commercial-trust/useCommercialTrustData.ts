"use client";

import { useEffect, useState } from "react";

import type { CommercialTrustProfileResponseDto } from "@venext/shared-contracts";

import { fetchCommercialTrustProfile } from "./commercial-trust-api";

export function useCommercialTrustData(organizationId: string) {
  const [data, setData] = useState<CommercialTrustProfileResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchCommercialTrustProfile(organizationId)
      .then((r) => {
        if (cancelled) return;
        if (!r.ok) {
          setData(null);
          setError(
            r.code === "commercial_trust_response_invalid"
              ? "Réponse confiance corridor non conforme (contrat API)."
              : "couche_confiance_indisponible",
          );
          return;
        }
        setData(r.data);
        setError(null);
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
