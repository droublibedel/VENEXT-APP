import type { EconomicScenariosBundle } from "@venext/shared-contracts";

export function ScenarioMemorySurface({ bundle }: { bundle: EconomicScenariosBundle | null }) {
  const rows = bundle?.scenarios.filter((s) => s.memoryLink) ?? [];
  if (!rows.length) return null;
  return (
    <section className="rounded border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-100">Memory links</h3>
      <p className="text-slate-500">Similarity to stored memory — non-causal.</p>
      <ul className="mt-1 list-inside list-disc">
        {rows.slice(0, 4).map((s) => (
          <li key={s.scenarioCode}>
            {s.scenarioType}: hist {s.memoryLink?.historicalSimilarity.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
