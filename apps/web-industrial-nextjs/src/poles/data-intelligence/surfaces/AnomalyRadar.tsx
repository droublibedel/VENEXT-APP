"use client";

import type { AnomalyIntelligenceResponse } from "@venext/shared-contracts";

export function AnomalyRadar({ data }: { data: AnomalyIntelligenceResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  return (
    <section className="rounded border border-rose-900/40 bg-rose-950/20 p-3 text-xs text-rose-100/90">
      <p className="font-semibold">Anomaly intelligence</p>
      <ul className="mt-2 space-y-2">
        {data.anomalies.slice(0, 6).map((a) => (
          <li key={a.id}>
            <span className="font-mono text-[10px]">{a.kind}</span> · sev {a.severity.toFixed(2)} — {a.probableCause}
          </li>
        ))}
      </ul>
    </section>
  );
}
