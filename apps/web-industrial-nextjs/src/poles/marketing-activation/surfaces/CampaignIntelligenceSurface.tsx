"use client";

import type { CampaignIntelligenceResponse } from "@venext/shared-contracts";

export function CampaignIntelligenceSurface({ data }: { data: CampaignIntelligenceResponse | undefined }) {
  if (!data) return null;
  return (
    <section className="space-y-2 rounded border border-amber-900/25 bg-amber-950/10 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90">Campaign intelligence</p>
        <p className="text-[11px] text-slate-500">{data.moduleNote}</p>
        <p className="font-mono text-[9px] text-slate-600">{data.layer}</p>
      </header>
      <ul className="space-y-2 text-[11px]">
        {data.campaigns.map((c) => (
          <li key={c.id} className="rounded border border-slate-800/70 bg-slate-950/50 px-2 py-2">
            <div className="flex justify-between gap-2">
              <span className="text-slate-100">{c.label}</span>
              <span className="text-[9px] uppercase text-amber-200/80">{c.status}</span>
            </div>
            <p className="text-[10px] text-slate-500">
              {c.kind} · efficiency {c.efficiency.toFixed(2)} · decay {c.decayIndex.toFixed(2)}
            </p>
            {c.territoryKeys.length ? (
              <p className="text-[9px] text-slate-600">Territories: {c.territoryKeys.join(", ")}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
