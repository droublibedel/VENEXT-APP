import type { EconomicScenariosBundle } from "@venext/shared-contracts";

export function ScenarioTrajectorySurface({ bundle }: { bundle: EconomicScenariosBundle | null }) {
  if (!bundle?.scenarios.length) return null;
  return (
    <section className="rounded border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-100">Trajectories</h3>
      <p className="text-slate-500">T0–T3 steps derive from propagation shocks, chains, fragility — not wall-clock forecasts.</p>
      <ul className="mt-2 list-inside list-disc text-slate-400">
        {bundle.scenarios.slice(0, 4).map((s) => (
          <li key={s.scenarioCode}>
            {s.scenarioType}: T3 risk {s.trajectory.steps.find((x) => x.label === "T3")?.systemicRisk.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
