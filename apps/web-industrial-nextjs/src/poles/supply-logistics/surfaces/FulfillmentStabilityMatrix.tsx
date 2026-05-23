"use client";

import type { FulfillmentStabilityMatrixResponse } from "@venext/shared-contracts";

export function FulfillmentStabilityMatrix({ data }: { data: FulfillmentStabilityMatrixResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") return null;
  return (
    <section className="space-y-2 rounded border border-sky-900/25 bg-slate-950/35 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-200/85">Fulfillment stability</p>
        <p className="font-mono text-[11px] text-sky-100/90">
          σ {data.stabilityScore.toFixed(2)} · variance {data.executionVariance.toFixed(2)} · downstream{" "}
          {data.downstreamCoherence.toFixed(2)}
        </p>
      </header>
      <ul className="space-y-1 text-[11px]">
        {data.bands.map((b) => (
          <li key={b.id} className="flex justify-between rounded border border-slate-800/50 px-2 py-1">
            <span className="text-slate-400">{b.label}</span>
            <span className="font-mono text-sky-200/90">
              {b.score.toFixed(2)} · {b.vector}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
