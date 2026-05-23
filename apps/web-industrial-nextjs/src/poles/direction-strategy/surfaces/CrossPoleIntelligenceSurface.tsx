"use client";

export function CrossPoleIntelligenceSurface({ data }: { data: unknown }) {
  const x = data as {
    crossPoleLayer?: {
      headline?: string;
      layers?: { pole: string; readiness: number; synthesis: string }[];
    };
  } | null;

  const layers = x?.crossPoleLayer?.layers ?? [];

  if (!layers.length) {
    return <p className="text-xs text-slate-500">Cross-pole synthesis unavailable.</p>;
  }

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Cross-pole intelligence layer</p>
        <p className="text-xs text-slate-500">{x?.crossPoleLayer?.headline}</p>
      </header>
      <div className="grid gap-2 md:grid-cols-2">
        {layers.map((l) => (
          <div key={l.pole} className="rounded border border-slate-800/90 bg-slate-950/70 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">{l.pole}</span>
              <span className="font-mono text-xs text-cyan-200/90">{l.readiness.toFixed(2)}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{l.synthesis}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
