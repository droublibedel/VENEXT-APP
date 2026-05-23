import type { CommercialCorridorProfileDto } from "@venext/shared-contracts";

export function CorridorSignalsSurface({ data }: { data: CommercialCorridorProfileDto | null }) {
  if (!data?.signals?.length) {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
        Aucun signal corridor consolidé pour cette fenêtre.
      </section>
    );
  }
  return (
    <section className="rounded border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-200">
      <h2 className="font-semibold uppercase tracking-[0.2em] text-slate-400">Signaux corridor</h2>
      <ul className="mt-3 space-y-2">
        {data.signals.map((s) => (
          <li key={s.signalType} className="rounded border border-slate-800/80 bg-slate-950/50 px-2 py-1.5">
            <div className="font-mono text-[11px] text-violet-200/90">{s.signalType}</div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{s.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
