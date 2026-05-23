"use client";

const STATES: string[] = [
  "DRAFT",
  "NEGOTIATION",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
];

export function RelationalOrderStatesSurface() {
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-orders-states-legend">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
        États corridor (sans paiement)
      </h3>
      <p className="mb-2 text-[9px] text-slate-500">
        Cycle symbolique relationnel — pas d’états marketplace type « payé », pas de wallet PSP sur cette couche.
      </p>
      <ul className="flex flex-wrap gap-1">
        {STATES.map((s) => (
          <li key={s} className="rounded border border-slate-800/90 bg-black/35 px-1.5 py-0.5 font-mono text-[8px] text-slate-300">
            {s}
          </li>
        ))}
      </ul>
    </section>
  );
}
