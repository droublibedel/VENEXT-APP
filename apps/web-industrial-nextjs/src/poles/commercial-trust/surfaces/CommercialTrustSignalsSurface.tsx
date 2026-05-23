import type { CommercialTrustProfileResponseDto } from "@venext/shared-contracts";

export function CommercialTrustSignalsSurface({
  data,
}: {
  data: CommercialTrustProfileResponseDto | null;
}) {
  if (!data?.signals?.length) {
    return <p className="text-xs text-slate-500">Signaux heuristiques non disponibles pour cette lecture.</p>;
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200">
      <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Signaux heuristiques</h2>
      <ul className="mt-3 space-y-3">
        {data.signals.map((s) => (
          <li key={s.signalType} className="rounded border border-slate-800/80 bg-slate-900/40 p-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-cyan-200/90">{s.signalType}</span>
              <span className="font-mono text-slate-400">{(s.signalStrength * 100).toFixed(0)}%</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{s.explanation}</p>
            <p className="mt-1 text-[9px] uppercase tracking-wide text-slate-600">
              confiance {s.confidenceLevel} — heuristique seulement
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
