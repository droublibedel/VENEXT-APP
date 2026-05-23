import type { EconomicScenariosBundle } from "@venext/shared-contracts";

export function ScenarioComparisonSurface({ bundle }: { bundle: EconomicScenariosBundle | null }) {
  if (!bundle?.comparisons.length) return null;
  return (
    <section className="rounded border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-100">Comparisons</h3>
      <ul className="list-inside list-disc text-slate-400">
        {bundle.comparisons.slice(0, 6).map((c, i) => (
          <li key={`${c.scenarioA.scenarioCode}-${c.scenarioB.scenarioCode}-${i}`}>
            {c.scenarioA.scenarioType} vs {c.scenarioB.scenarioType} · sim {c.similarityScore.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
