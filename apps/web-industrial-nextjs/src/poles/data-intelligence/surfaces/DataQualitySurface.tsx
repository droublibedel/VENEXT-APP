"use client";

import type { DataQualityIntelligenceResponse } from "@venext/shared-contracts";

export function DataQualitySurface({ data }: { data: DataQualityIntelligenceResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300">
      <p className="font-semibold text-slate-100">Data quality guardian</p>
      <p className="mt-1 text-slate-400">Readiness {data.guardianReadiness.toFixed(2)}</p>
      <ul className="mt-2 space-y-1 text-[11px]">
        {data.issues.map((i) => (
          <li key={i.id}>
            {i.kind} — {i.detail}
          </li>
        ))}
      </ul>
    </section>
  );
}
