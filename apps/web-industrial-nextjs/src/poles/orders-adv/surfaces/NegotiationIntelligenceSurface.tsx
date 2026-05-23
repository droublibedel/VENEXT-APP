"use client";

import type { NegotiationIntelligenceResponse } from "@venext/shared-contracts";

export function NegotiationIntelligenceSurface({ data }: { data: NegotiationIntelligenceResponse | undefined }) {
  if (!data) return null;
  if (data.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Negotiation intelligence disabled by <span className="font-mono text-slate-300">negotiation_intelligence_enabled</span>.
      </div>
    );
  }
  return (
    <section className="space-y-2 rounded border border-amber-900/30 bg-slate-950/40 px-3 py-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90">Negotiation intelligence</p>
        <p className="text-[11px] text-slate-500">
          Unstable {data.unstableNegotiations} · bursts 24h {data.negotiationBursts24h}
        </p>
      </header>
      <ul className="max-h-44 space-y-1 overflow-y-auto text-[11px]">
        {data.rows.slice(0, 12).map((r) => (
          <li key={r.negotiationId} className="flex justify-between gap-2 rounded border border-slate-800/60 px-2 py-1">
            <span className="text-slate-200">{r.status}</span>
            <span className="font-mono text-rose-200/90">{r.priceTension.toFixed(2)}</span>
            <span className="text-[9px] text-slate-500">{r.stalled ? "stalled" : "flow"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
