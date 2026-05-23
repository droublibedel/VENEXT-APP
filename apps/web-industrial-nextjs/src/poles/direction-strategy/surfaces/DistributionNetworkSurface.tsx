"use client";

export function DistributionNetworkSurface({ data }: { data: unknown }) {
  const d = data as {
    strongestWholesalers?: { label: string; edgeStrength: number; instability: boolean }[];
    unstableWholesalers?: { label: string }[];
    weakRetailerRegions?: { region: string }[];
    supplyFragility?: string;
    inactivePartners?: { label: string; reason: string }[];
  } | null;

  if (!d) return <p className="text-xs text-slate-500">Distribution intelligence unavailable.</p>;

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Distribution network intelligence</p>
        <p className="text-xs text-slate-500">Upstream/downstream posture — geographic & category segmentation.</p>
      </header>
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-slate-700 px-2 py-0.5 text-slate-300">
          Supply fragility: <span className="text-amber-200/90">{d.supplyFragility ?? "—"}</span>
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase text-slate-500">Strongest wholesalers</p>
          <ul className="mt-1 space-y-1 text-[11px] text-slate-300">
            {(d.strongestWholesalers ?? []).slice(0, 6).map((w, i) => (
              <li key={i} className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                <span>{w.label}</span>
                <span className="font-mono text-cyan-200/80">{w.edgeStrength.toFixed(3)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase text-slate-500">Unstable edges</p>
          <ul className="mt-1 space-y-1 text-[11px] text-rose-200/80">
            {(d.unstableWholesalers ?? []).map((w, i) => (
              <li key={i}>{w.label}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase text-slate-500">Weak retailer regions</p>
          <ul className="mt-1 space-y-1 text-[11px] text-slate-400">
            {(d.weakRetailerRegions ?? []).map((x, i) => (
              <li key={i}>{x.region}</li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase text-slate-500">Inactive partner signals</p>
        <ul className="mt-1 space-y-1 text-[11px] text-slate-500">
          {(d.inactivePartners ?? []).map((p, i) => (
            <li key={i}>
              {p.label} — {p.reason}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
