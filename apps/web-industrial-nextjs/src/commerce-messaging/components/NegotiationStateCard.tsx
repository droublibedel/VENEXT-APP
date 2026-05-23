"use client";

import type { CommerceContextResponse } from "../types";

type Props = {
  negotiation: NonNullable<CommerceContextResponse["negotiation"]>;
};

export function NegotiationStateCard({ negotiation }: Props) {
  return (
    <aside className="rounded-lg border border-slate-800/90 bg-slate-950/80 p-3 text-[11px] text-slate-200">
      <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-cyan-200/80">Moteur négociation</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
        <dt className="text-slate-500">Statut</dt>
        <dd className="font-mono text-cyan-100/90">{negotiation.status}</dd>
        <dt className="text-slate-500">Qté proposée</dt>
        <dd className="font-mono">{negotiation.proposedQuantity ?? "—"}</dd>
        <dt className="text-slate-500">Prix proposé</dt>
        <dd className="font-mono">{negotiation.proposedPrice ?? "—"}</dd>
        <dt className="text-slate-500">Qté acceptée</dt>
        <dd className="font-mono">{negotiation.acceptedQuantity ?? "—"}</dd>
        <dt className="text-slate-500">Prix accepté</dt>
        <dd className="font-mono">{negotiation.acceptedPrice ?? "—"}</dd>
      </dl>
    </aside>
  );
}
