"use client";

import { memo } from "react";

import { buildCommercialMailActivityHints } from "./producer-commercial-mail-intelligence";
import type { ProducerCommercialMailView } from "./producer-commercial-mail.types";

export const ProducerMailActivityPanel = memo(function ProducerMailActivityPanel({
  view,
}: {
  view: ProducerCommercialMailView | null;
}) {
  const hints = buildCommercialMailActivityHints(view);

  return (
    <section className="producer-industrial-card p-3" data-testid="producer-mail-activity-panel">
      <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Activité commerciale</h4>
      <p className="mt-2 text-[11px] text-slate-300">{view?.activitySummary ?? "—"}</p>
      <ul className="mt-2 space-y-1">
        {hints.map((h) => (
          <li key={h.id} className="text-[10px] text-slate-500" data-testid={`mail-activity-hint-${h.id}`}>
            {h.text}
          </li>
        ))}
      </ul>
    </section>
  );
});
