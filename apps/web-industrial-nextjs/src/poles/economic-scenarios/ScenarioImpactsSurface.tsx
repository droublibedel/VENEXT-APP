import type { EconomicScenariosBundle, ScenarioImpactRow } from "@venext/shared-contracts";

function isSyntheticImpact(imp: ScenarioImpactRow): boolean {
  return imp.source === "SYNTHETIC_FALLBACK" || imp.observational === false;
}

export function ScenarioImpactsSurface({ bundle }: { bundle: EconomicScenariosBundle | null }) {
  if (!bundle?.scenarios.length) return null;
  return (
    <section className="rounded border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-100">Propagation-linked impacts</h3>
      <p className="text-slate-500">
        Rows derived from propagation chains are symbolic projections. Items marked synthetic fallback are not observed propagation
        impacts.
      </p>
      <ul className="mt-2 space-y-2">
        {bundle.scenarios.slice(0, 3).map((s) => (
          <li key={s.scenarioCode} className="rounded border border-slate-800/60 bg-slate-900/30 p-2">
            <div className="font-medium text-slate-200">{s.scenarioType}</div>
            <ul className="mt-1 list-inside list-disc text-slate-400">
              {s.impacts.slice(0, 6).map((im, i) => (
                <li key={`${s.scenarioCode}-${i}`}>
                  <span className="font-mono text-[10px] text-cyan-200/90">{im.targetPole}</span> — {im.impactKind}
                  {isSyntheticImpact(im) ? (
                    <span className="ml-1 rounded bg-amber-950/80 px-1 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
                      synthetic projection
                    </span>
                  ) : (
                    <span className="ml-1 text-[10px] text-slate-500">observational (propagation-derived)</span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
