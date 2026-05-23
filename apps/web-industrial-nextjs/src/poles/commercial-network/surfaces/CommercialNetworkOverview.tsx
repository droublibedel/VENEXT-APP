"use client";

export function CommercialNetworkOverview({ data }: { data: unknown }) {
  const o = data as {
    signalStrips?: { id: string; band: string; intensity: number; label: string }[];
    activeWholesalers?: number;
    unstableWholesalers?: number;
    retailerGrowthVelocity?: number;
    inactiveRegions?: string[];
    commercialConfidence?: number;
    negotiationActivityLevel?: number;
  } | null;

  if (!o) return <p className="text-xs text-slate-500">Overview unavailable.</p>;

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Commercial network overview</p>
        <p className="text-xs text-slate-500">Signal strips & tension bands — not CRM pipeline chrome.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {(o.signalStrips ?? []).map((s) => (
          <div
            key={s.id}
            className="min-w-[140px] flex-1 rounded border border-slate-800/90 bg-gradient-to-br from-slate-950/90 to-cyan-950/20 px-2 py-2"
          >
            <p className="text-[9px] font-mono uppercase tracking-wide text-cyan-200/70">{s.band}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-slate-800">
              <div className="h-full bg-cyan-500/70" style={{ width: `${Math.min(100, s.intensity * 100)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-300">{s.label}</p>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 md:grid-cols-4">
        <div>
          <dt className="text-slate-600">Wholesalers</dt>
          <dd className="font-mono text-cyan-100/90">{o.activeWholesalers ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Unstable</dt>
          <dd className="font-mono text-rose-200/90">{o.unstableWholesalers ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Retail velocity</dt>
          <dd className="font-mono text-slate-200">{o.retailerGrowthVelocity ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Confidence</dt>
          <dd className="font-mono text-slate-200">{o.commercialConfidence?.toFixed?.(2) ?? "—"}</dd>
        </div>
        <div className="col-span-2 md:col-span-4">
          <dt className="text-slate-600">Inactive regions</dt>
          <dd className="text-slate-300">{(o.inactiveRegions ?? []).slice(0, 6).join(" · ") || "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
