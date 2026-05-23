"use client";

export function DistributorPerformanceObservatory({ data }: { data: unknown }) {
  const d = data as {
    rows?: {
      displayName: string;
      band: string;
      orderFlow30d: number;
      priorOrders30d?: number;
      messageThreads30d: number;
      negotiations30d: number;
      sponsoredInteractions30d?: number;
      trustLevel: number | null;
    }[];
  } | null;
  if (!d?.rows?.length) return <p className="text-xs text-slate-500">No distributor observatory rows.</p>;
  return (
    <section className="space-y-2">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Distributor performance observatory</p>
        <p className="text-xs text-slate-500">Wholesale supervision — order flow × engagement fusion.</p>
      </header>
      <ul className="max-h-[220px] space-y-1 overflow-y-auto text-[11px]">
        {d.rows.slice(0, 16).map((row) => (
          <li key={row.displayName} className="flex justify-between gap-2 border-b border-slate-800/60 py-1 text-slate-300">
            <span>
              <span className="font-mono text-[10px] text-cyan-200/70">{row.band}</span> · {row.displayName}
            </span>
            <span className="font-mono text-slate-500">
              ord {row.orderFlow30d}
              {typeof row.priorOrders30d === "number" ? ` / prior ${row.priorOrders30d}` : ""}
              {` · neg ${row.negotiations30d} · thr ${row.messageThreads30d}`}
              {typeof row.sponsoredInteractions30d === "number" ? ` · inj ${row.sponsoredInteractions30d}` : ""}
              {row.trustLevel != null ? ` · τ${row.trustLevel.toFixed(2)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
