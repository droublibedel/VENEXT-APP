"use client";

import type { CollectionPrioritiesResponse } from "@venext/shared-contracts";

export function CollectionPriorityQueue({ data }: { data: CollectionPrioritiesResponse | undefined }) {
  if (!data || data.policy === "DISABLED") {
    return <p className="rounded border border-slate-800 bg-slate-950/50 p-3 text-[11px] text-slate-500">Collection priorities — disabled.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-200/90">Collection priority queue</h3>
      <ol className="mt-2 max-h-40 space-y-1 overflow-auto text-[10px] text-slate-300">
        {data.items.slice(0, 14).map((i) => (
          <li key={i.id} className="font-mono">
            #{i.rank} {i.buyerDisplayName} · {i.territoryCode} · {i.amount.toFixed(0)} {i.currency} · {i.riskLevel}
          </li>
        ))}
      </ol>
    </section>
  );
}
