"use client";

import type { RelationalOperationalSimulationDto } from "@venext/shared-contracts";

export function SimulationRiskSurface(props: { simulations: RelationalOperationalSimulationDto[] }) {
  const high = props.simulations.filter(
    (s) => s.outcome === "HIGH_RISK" || s.outcome === "COLLAPSE_RISK" || s.severity === "CRITICAL",
  );
  if (high.length === 0) return <p className="text-[9px] text-slate-500">Aucune projection à risque élevé.</p>;
  return (
    <ul className="mt-1 space-y-1" data-testid="simulation-risk">
      {high.slice(0, 6).map((s) => (
        <li key={s.id} className="rounded border border-amber-900/40 bg-amber-950/20 px-2 py-1 text-[9px] text-amber-100/90">
          {s.simulationType} — {s.outcome ?? s.status} (score {s.resultingRiskScore ?? s.expectedRiskScore})
        </li>
      ))}
    </ul>
  );
}
