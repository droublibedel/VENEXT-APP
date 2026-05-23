"use client";

import { memo } from "react";

import { buildCommercialMailHints } from "./producer-commercial-mail-intelligence";
import type { ProducerCommercialMailView } from "./producer-commercial-mail.types";

export const ProducerMailInsightsPanel = memo(function ProducerMailInsightsPanel({
  view,
}: {
  view: ProducerCommercialMailView | null;
}) {
  const hints = buildCommercialMailHints(view);

  return (
    <section className="producer-industrial-card p-3" data-testid="producer-mail-insights-panel">
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Signaux discrets</h4>
      {hints.length === 0 ? (
        <p className="mt-2 text-[10px] text-slate-500">Aucun signal particulier.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {hints.map((h) => (
            <li
              key={h.id}
              className="rounded border border-slate-800/60 bg-slate-950/30 px-2 py-1.5 text-[10px] text-slate-400"
              data-testid={`mail-insight-${h.id}`}
            >
              {h.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
