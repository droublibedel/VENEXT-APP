"use client";

import { memo } from "react";

import type { ProducerCommercialMailView } from "./producer-commercial-mail.types";

export const ProducerMailSettlementsPanel = memo(function ProducerMailSettlementsPanel({
  view,
}: {
  view: ProducerCommercialMailView | null;
}) {
  const settlements = view?.settlements ?? [];

  return (
    <section className="producer-industrial-card p-3" data-testid="producer-mail-settlements-panel">
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Règlements liés</h4>
      {settlements.length === 0 ? (
        <p className="mt-2 text-[10px] text-slate-500">Aucun règlement contextuel.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {settlements.slice(0, 5).map((s) => (
            <li
              key={s.id}
              className="rounded border border-slate-800/70 px-2 py-1.5 text-[10px]"
              data-testid={`mail-linked-settlement-${s.id}`}
            >
              <span className="font-medium text-slate-200">{s.reference}</span>
              <span className="block text-slate-500">{s.partner}</span>
              <span className="text-emerald-400/80">{s.amountLabel}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
