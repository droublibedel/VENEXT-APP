"use client";

import type { RelationalOperationalSimulationDto } from "@venext/shared-contracts";

export function SimulationOutcomeSurface(props: { simulations: RelationalOperationalSimulationDto[] }) {
  const latest = props.simulations.find((s) => s.status === "COMPLETED");
  if (!latest?.results.length) {
    return <p className="text-[9px] text-slate-500">Aucun résultat de simulation disponible.</p>;
  }
  const r = latest.results[0]!;
  return (
    <div className="rounded border border-slate-800/80 px-2 py-2 text-[9px] text-slate-300" data-testid="simulation-outcome">
      <p className="font-medium text-slate-200">{r.resultTitle}</p>
      <p className="mt-1 text-slate-400">{r.resultDescription}</p>
      <p className="mt-1 text-slate-500">
        SLA projeté {r.projectedSlaImpact} · Impact op. {r.projectedOperationalImpact} · État {r.projectedCorridorState}
      </p>
    </div>
  );
}
