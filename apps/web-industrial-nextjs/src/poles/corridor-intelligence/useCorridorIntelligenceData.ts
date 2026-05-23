"use client";

import { useEffect, useState } from "react";

import type { CommercialCorridorProfileDto } from "@venext/shared-contracts";

import { fetchCorridorIntelligenceProfile } from "./corridor-intelligence-api";

export function useCorridorIntelligenceData(relationshipId: string | null) {
  const [data, setData] = useState<CommercialCorridorProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!relationshipId) {
      setLoading(false);
      setData(null);
      setError("corridor_relationship_required");
      return () => {
        cancelled = true;
      };
    }
    setLoading(true);
    void fetchCorridorIntelligenceProfile(relationshipId)
      .then((r) => {
        if (cancelled) return;
        if (!r.ok) {
          setData(null);
          setError(
            r.code === "corridor_intelligence_response_invalid"
              ? "Réponse intelligence corridor non conforme (contrat API)."
              : "corridor_intelligence_indisponible",
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
  }, [relationshipId]);

  return { data, loading, error };
}
