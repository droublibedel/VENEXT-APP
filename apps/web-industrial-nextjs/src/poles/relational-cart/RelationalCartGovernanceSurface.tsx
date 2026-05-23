"use client";

import React from "react";

export function RelationalCartGovernanceSurface(props: {
  relationshipId?: string;
  sourceReadiness?: Record<string, "READY" | "NOT_CONNECTED_YET" | "CONNECTED"> | null;
}) {
  const sr = props.sourceReadiness;
  const manual = sr?.MANUAL_RELATIONAL_ENTRY;
  const reorder = sr?.RELATIONAL_REORDER;

  return (
    <article className="rounded border border-neutral-200 p-3">
      <h3 className="font-medium">Validation corridor</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Diagnostics gouvernance corridor {props.relationshipId ? `(relation ${props.relationshipId})` : ""} — état
        opérationnel, avertissements DEGRADED, pas exposition marketplace.
      </p>
      {sr ? (
        <div className="mt-3 space-y-2 text-sm">
          <div className="text-neutral-700">
            <span className="font-medium">MANUAL_RELATIONAL_ENTRY</span> — {manual ?? "—"}
          </div>
          <div className="text-neutral-700">
            <span className="font-medium">RELATIONAL_REORDER</span> — {reorder ?? "—"}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">Prêt à afficher la matrice readiness quand un panier est chargé.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" disabled className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-400">
          {manual === "CONNECTED"
            ? "Entrée catalogue relationnel (connectée — action dans le pôle Catalogues relationnels)"
            : "Entrée manuelle corridor (non connecté)"}
        </button>
        <button type="button" disabled className="rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-400">
          Re-commande relationnelle (non connecté)
        </button>
      </div>
    </article>
  );
}
