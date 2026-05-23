"use client";

import type { DecisionSimulationResponse } from "@venext/shared-contracts";

export function DecisionSimulationSurface({ data }: { data: DecisionSimulationResponse | undefined }) {
  if (!data || data.policy === "DISABLED") return null;
  const sim = data.acceptOrderSimulation ?? data.scenarios[0];
  if (!sim) return null;
  return (
    <section className="rounded border border-amber-900/40 bg-amber-950/20 p-3 text-xs text-amber-50/95">
      <p className="font-semibold">Decision simulation</p>
      <p className="mt-1">{sim.headlinePrescription}</p>
      <ul className="mt-2 space-y-1 text-[11px]">
        {sim.tradeoffs.map((t) => (
          <li key={t.dimension}>
            <span className="font-mono text-amber-200/90">{t.dimension}</span> — {t.prescription}
          </li>
        ))}
      </ul>
    </section>
  );
}
