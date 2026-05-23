import type { EconomicScenariosBundle } from "@venext/shared-contracts";

export function ScenarioStabilizationSurface({ bundle }: { bundle: EconomicScenariosBundle | null }) {
  const first = bundle?.scenarios.find((s) => s.stabilization);
  if (!first?.stabilization) return null;
  return (
    <section className="rounded border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-300">
      <h3 className="mb-1 font-semibold text-slate-100">Stabilization (sample)</h3>
      <p className="text-slate-500">{first.stabilization.note}</p>
      <ul className="mt-1 list-inside list-disc text-slate-400">
        {first.stabilization.stabilizationDirections.slice(0, 4).map((d) => (
          <li key={d.code}>
            {d.label} · conf {d.estimatedConfidence.toFixed(2)}
          </li>
        ))}
      </ul>
    </section>
  );
}
