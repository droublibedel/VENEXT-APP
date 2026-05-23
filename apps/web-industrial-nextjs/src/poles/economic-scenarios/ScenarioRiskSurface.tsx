import type { EconomicScenariosBundle } from "@venext/shared-contracts";

export function ScenarioRiskSurface({ bundle }: { bundle: EconomicScenariosBundle | null }) {
  const rows = bundle?.scenarios.filter((s) => s.risk) ?? [];
  if (!rows.length) return null;
  return (
    <section className="rounded border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-100">Risk lattice</h3>
      <p className="text-slate-500">Heuristic axes — collapseProbability is not market-implied.</p>
      <ul className="mt-1 list-inside list-disc">
        {rows.slice(0, 4).map((s) => (
          <li key={s.scenarioCode}>
            {s.scenarioType}: collapse {s.risk?.collapseProbability.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
