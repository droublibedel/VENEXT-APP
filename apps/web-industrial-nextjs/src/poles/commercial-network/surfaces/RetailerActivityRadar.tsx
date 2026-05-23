"use client";

export function RetailerActivityRadar({ data }: { data: unknown }) {
  const r = data as {
    policy?: string;
    segmentSummary?: { active: number; inactive: number; rising: number; regionalPressure: number; other: number };
    groupBuyingSignals?: { available: boolean; reason?: string; sessions30d?: number; relationshipScopedSessions30d?: number };
    rows?: { displayName: string; segment: string; velocityScore: number; regionKey: string }[];
  } | null;

  if (r?.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Retailer radar disabled by <span className="font-mono text-slate-300">retailer_radar_enabled</span>.
      </div>
    );
  }

  if (!r?.rows?.length) return <p className="text-xs text-slate-500">No retailer radar rows.</p>;

  return (
    <section className="space-y-2">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Retailer activity radar</p>
        <p className="text-xs text-slate-500">Segmentation from downstream velocity — not lead scoring.</p>
      </header>
      {r.segmentSummary ? (
        <p className="text-[10px] text-slate-600">
          Segments · active {r.segmentSummary.active} · inactive {r.segmentSummary.inactive} · rising {r.segmentSummary.rising} ·
          pressure {r.segmentSummary.regionalPressure} · other {r.segmentSummary.other}
        </p>
      ) : null}
      {r.groupBuyingSignals ? (
        <p className="text-[10px] text-slate-600">
          Group buying:{" "}
          {r.groupBuyingSignals.available
            ? `sessions30d ${r.groupBuyingSignals.sessions30d ?? 0} · rel-scoped ${r.groupBuyingSignals.relationshipScopedSessions30d ?? 0}`
            : `unavailable (${r.groupBuyingSignals.reason ?? "n/a"})`}
        </p>
      ) : null}
      <ul className="max-h-[200px] space-y-1 overflow-y-auto text-[11px]">
        {r.rows.slice(0, 18).map((row) => (
          <li key={row.displayName + row.segment} className="flex justify-between gap-2 border-b border-slate-800/60 py-1">
            <span className="text-slate-300">{row.displayName}</span>
            <span className="font-mono text-[10px] text-cyan-200/80">
              {row.segment} · {row.velocityScore.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
