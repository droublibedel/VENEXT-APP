"use client";

import { useEffect, useState } from "react";

import type { CommercialTrustRelationshipResponseDto } from "@venext/shared-contracts";

import { fetchCommercialTrustRelationship } from "../commercial-trust-api";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function CommercialTrustRelationshipSnapshotSurface({
  relationshipId,
}: {
  relationshipId?: string | null;
}) {
  const [data, setData] = useState<CommercialTrustRelationshipResponseDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!relationshipId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchCommercialTrustRelationship(relationshipId).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (!r.ok) {
        setData(null);
        setError(
          r.code === "commercial_trust_response_invalid"
            ? "Réponse corridor non conforme (contrat API)."
            : "corridor_indisponible",
        );
        return;
      }
      setData(r.data);
    });
    return () => {
      cancelled = true;
    };
  }, [relationshipId]);

  if (!relationshipId) {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Instantané corridor</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Aucun corridor sélectionné — ajoutez <span className="font-mono">?relationshipId=…</span> à l’URL ou{" "}
          <span className="font-mono">NEXT_PUBLIC_COMMERCIAL_TRUST_RELATIONSHIP_ID</span> pour charger un instantané
          relationnel réel (pas de données simulées).
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Instantané corridor</h2>
        <VenextInlineSkeleton variant="pole" className="mt-2 py-2" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Instantané corridor</h2>
        <p className="mt-2 text-xs text-amber-300/90">{error ?? "corridor_indisponible"}</p>
      </section>
    );
  }

  const snap = data.snapshot;

  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Instantané corridor</h2>
      <p className="mt-2 text-[10px] text-slate-500">
        Source : <span className="font-mono">GET /commercial-trust/relationship/{data.relationshipId}</span> — pas
        d’agrégat public ni de fil social.
      </p>
      {snap ? (
        <ul className="mt-3 space-y-1 text-[10px] text-slate-400">
          <li>Négociations (échantillon corridor) : {snap.negotiationCount}</li>
          <li>Négociations conclues (heuristique) : {snap.successfulNegotiationCount}</li>
          <li>Origine découverte sponsorisée : {snap.sponsoredDiscoveryOrigin ? "oui" : "non"}</li>
          <li>Direction confiance : {snap.trustDirection}</li>
          <li>Dernière interaction : {snap.lastInteractionAt ?? "—"}</li>
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Aucun instantané persisté pour ce corridor (normal si neuf).</p>
      )}
    </section>
  );
}
