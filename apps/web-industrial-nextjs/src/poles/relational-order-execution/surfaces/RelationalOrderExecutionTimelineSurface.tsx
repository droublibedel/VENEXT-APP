"use client";

import type { RelationalOrderExecutionEventDto, RelationalOrderExecutionViewResponseDto } from "@venext/shared-contracts";

import { relationExecutionEventHeadline } from "../relational-order-execution-copy";

export function RelationalOrderExecutionTimelineSurface(props: { data: RelationalOrderExecutionViewResponseDto | null }) {
  const { data } = props;
  if (!data?.events?.length) {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-order-execution-timeline">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Chronologie d’exécution</p>
        <p className="mt-2 text-[10px] text-slate-500">Aucun événement d’exécution enregistré pour cette commande.</p>
      </section>
    );
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-order-execution-timeline">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Chronologie d’exécution</p>
      <ul className="mt-2 space-y-2">
        {data.events.map((e: RelationalOrderExecutionEventDto) => (
          <li
            key={e.id}
            className="rounded border border-slate-800/80 bg-slate-950/60 px-2 py-1 text-[9px] text-slate-300"
            data-testid="relational-order-execution-timeline-row"
          >
            <span className="font-mono text-cyan-100/90">{relationExecutionEventHeadline(e.eventType)}</span>
            <span className="text-slate-500"> · </span>
            <span className="font-mono text-slate-400">
              {e.previousStatus ?? "—"} → {e.nextStatus}
            </span>
            <div className="mt-0.5 font-mono text-[8px] text-slate-500">{e.createdAt}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
