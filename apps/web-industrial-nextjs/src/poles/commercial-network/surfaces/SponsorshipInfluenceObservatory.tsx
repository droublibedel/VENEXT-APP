"use client";

export function SponsorshipInfluenceObservatory({ data }: { data: unknown }) {
  const s = data as {
    policy?: string;
    engineReuse?: string;
    pressureIndex?: number;
    sponsoredProductPenetration?: number;
    overexposureRisk?: number;
    effectivenessScore?: number;
    territoryImpact?: { key: string; score: number }[];
  } | null;

  if (s?.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Sponsorship observatory disabled by <span className="font-mono text-slate-300">sponsorship_observatory_enabled</span>.
      </div>
    );
  }

  if (!s) return <p className="text-xs text-slate-500">Sponsorship observatory unavailable.</p>;

  return (
    <section className="space-y-2">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Sponsorship influence observatory</p>
        <p className="text-xs text-slate-500">
          Engine: <span className="font-mono text-slate-400">{s.engineReuse ?? "—"}</span>
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
        <div>
          <dt className="text-slate-600">Pressure</dt>
          <dd className="font-mono">{s.pressureIndex?.toFixed(3) ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Penetration</dt>
          <dd className="font-mono">{s.sponsoredProductPenetration?.toFixed(3) ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Overexposure</dt>
          <dd className="font-mono text-rose-200/80">{s.overexposureRisk?.toFixed(3) ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Effectiveness</dt>
          <dd className="font-mono text-emerald-200/80">{s.effectivenessScore?.toFixed(3) ?? "—"}</dd>
        </div>
      </dl>
      <ul className="max-h-[120px] overflow-y-auto text-[10px] text-slate-500">
        {(s.territoryImpact ?? []).map((z) => (
          <li key={z.key}>
            {z.key} · {z.score.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
