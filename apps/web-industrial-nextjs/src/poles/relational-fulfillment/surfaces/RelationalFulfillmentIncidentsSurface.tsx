"use client";

import type { RelationalFulfillmentViewResponseDto } from "@venext/shared-contracts";

export function RelationalFulfillmentIncidentsSurface(props: { data: RelationalFulfillmentViewResponseDto | null }) {
  const incidents = props.data?.incidents ?? [];
  const blocking = incidents.filter((i) => i.blocksFulfillmentCompletion);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-fulfillment-incidents">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Incidents opérationnels corridor</p>
      <p className="mt-1 text-[9px] text-slate-500">
        Gouvernance inter-partenaires — pas ticket SAV marketplace ni litige public consommateur.
      </p>
      {blocking.length > 0 ? (
        <p className="mt-2 text-[9px] text-amber-200/90" data-testid="fulfillment-blocking-incidents-count">
          {blocking.length} incident(s) bloquant(s) la clôture fulfillment tant que non résolu(s).
        </p>
      ) : null}
      {incidents.length === 0 ? (
        <p className="mt-2 text-[9px] text-slate-500">Aucun incident corridor signalé.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {incidents.map((i) => (
            <li
              key={i.id}
              className="rounded border border-amber-900/30 bg-amber-950/20 px-2 py-1 text-[9px] text-amber-100/90"
              data-testid={`fulfillment-incident-${i.id}`}
            >
              <span className="font-mono">{i.incidentType}</span> · résolution{" "}
              <span className="font-mono text-cyan-200/90">{i.resolutionStatus}</span>
              {i.blocksFulfillmentCompletion ? (
                <span className="ml-1 text-amber-300">· bloque clôture</span>
              ) : null}
              {i.resolutionProposal ? (
                <div className="mt-0.5 text-slate-400">
                  Proposition : {i.resolutionProposal.slice(0, 120)}
                  {i.resolutionProposal.length > 120 ? "…" : ""}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
