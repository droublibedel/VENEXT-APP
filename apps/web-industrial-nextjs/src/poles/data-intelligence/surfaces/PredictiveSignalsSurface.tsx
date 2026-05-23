"use client";

import type { PredictiveSignalsResponse } from "@venext/shared-contracts";

export function PredictiveSignalsSurface({ data }: { data: PredictiveSignalsResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Predictive signals</p>
      <ul className="mt-2 space-y-2 text-[11px]">
        {data.signals.map((s) => (
          <li key={s.id}>
            <span className="text-violet-200/90">{s.timeHorizon}</span> · {s.headline}
          </li>
        ))}
      </ul>
    </section>
  );
}
