"use client";

import type { RelationalFulfillmentViewResponseDto } from "@venext/shared-contracts";

import { fulfillmentStatusHeadline } from "../relational-fulfillment-copy";

export function RelationalFulfillmentTimelineSurface(props: { data: RelationalFulfillmentViewResponseDto | null }) {
  const f = props.data?.fulfillment;
  if (!f) {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-fulfillment-timeline">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Chronologie fulfillment</p>
        <p className="mt-2 text-[10px] text-slate-500">Aucun enregistrement fulfillment pour cette commande.</p>
      </section>
    );
  }
  const steps = [
    { at: f.loadingConfirmedAt, label: "Chargement confirmé" },
    { at: f.transferStartedAt, label: "Départ transfert corridor" },
    { at: f.arrivedAtDestinationAt, label: "Arrivée destination" },
    { at: f.receptionValidatedAt, label: "Réception commerciale validée" },
    { at: f.fulfillmentCompletedAt, label: "Fulfillment terminé" },
  ].filter((s) => s.at);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-fulfillment-timeline">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Chronologie fulfillment</p>
      <p className="mt-1 text-[9px] text-slate-500">État actuel : {fulfillmentStatusHeadline(f.fulfillmentStatus)}</p>
      <ul className="mt-2 space-y-1">
        {steps.length === 0 ? (
          <li className="text-[9px] text-slate-500">En attente des jalons opérationnels.</li>
        ) : (
          steps.map((s) => (
            <li key={s.label} className="font-mono text-[9px] text-slate-400">
              {s.label} · {s.at}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
