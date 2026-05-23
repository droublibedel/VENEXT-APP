"use client";

import type { AdvCoordinationResponse } from "@venext/shared-contracts";

export function AdvCoordinationSurface({ data }: { data: AdvCoordinationResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-amber-900/25 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/85">ADV coordination</p>
        <p className="text-[11px] text-slate-500">
          Pending confirmations {data.pendingConfirmations} · validation depth {data.validationQueueDepth} · invoice readiness{" "}
          {data.invoiceReadiness.toFixed(2)}
        </p>
      </header>
      <ul className="max-h-36 space-y-1 overflow-y-auto text-[11px]">
        {data.items.slice(0, 10).map((it) => (
          <li key={it.id} className="flex justify-between gap-2 rounded border border-slate-800/60 px-2 py-1">
            <span className="text-slate-300">{it.label}</span>
            <span className="font-mono text-amber-200/90">{it.tension.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
