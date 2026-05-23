import type { EconomicScenariosBundle } from "@venext/shared-contracts";

export function ScenarioOverviewSurface({ bundle }: { bundle: EconomicScenariosBundle | null }) {
  if (!bundle) return <p className="text-xs text-slate-500">No bundle.</p>;
  return (
    <section className="rounded border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-100">Overview</h3>
      <p className="text-[10px] uppercase tracking-wide text-emerald-200/80">
        Source:{" "}
        {bundle.sourceMode === "LIVE_COMPOSED_SCENARIO"
          ? "LIVE_COMPOSED_SCENARIO — projection lattice (not persisted DB replay)."
          : "live composed bundle (awaiting sourceMode from API)."}
      </p>
      {bundle.liveComposeDiagnostics ? (
        <p className="mt-1 font-mono text-[10px] text-slate-500">
          compose cache: {bundle.liveComposeDiagnostics.composeCacheHit ? "hit" : "miss"} ·{" "}
          {bundle.liveComposeDiagnostics.cacheStrategy} · {bundle.liveComposeDiagnostics.serverCost}
        </p>
      ) : null}
      <p className="mt-1">{bundle.overview.headline}</p>
      <p className="mt-1 text-slate-500">Scenarios: {bundle.overview.scenarioCount}</p>
    </section>
  );
}
