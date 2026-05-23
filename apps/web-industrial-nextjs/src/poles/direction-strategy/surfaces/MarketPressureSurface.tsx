"use client";

export function MarketPressureSurface({ data }: { data: unknown }) {
  const p = data as {
    policy?: string;
    headline?: string;
    band?: string;
    confidence?: number;
    probableCauses?: string[];
    drivers?: { code: string; detail: string }[];
  } | null;

  if (!p) return <p className="text-xs text-slate-500">Market pressure unavailable.</p>;

  if (p.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Market pressure engine disabled by <span className="font-mono text-slate-300">market_pressure_enabled</span>.
      </div>
    );
  }

  return (
    <section className="space-y-2">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Market pressure monitoring</p>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
          {p.band}
        </span>
        <span className="text-[11px] text-slate-500">confidence {p.confidence?.toFixed(2) ?? "—"}</span>
      </div>
      <p className="text-sm text-slate-200">{p.headline}</p>
      <ul className="text-[11px] text-slate-400">
        {(p.probableCauses ?? []).map((c, i) => (
          <li key={i}>• {c}</li>
        ))}
      </ul>
      <div className="text-[11px] text-slate-500">
        {(p.drivers ?? []).map((d) => (
          <span key={d.code} className="mr-2 inline-block rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {d.code}
          </span>
        ))}
      </div>
    </section>
  );
}
