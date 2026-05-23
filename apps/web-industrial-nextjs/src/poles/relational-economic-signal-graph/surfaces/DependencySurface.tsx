"use client";

import type { RelationalEconomicSignalEdgeDto } from "@venext/shared-contracts";

export function DependencySurface(props: { edges: RelationalEconomicSignalEdgeDto[] }) {
  if (props.edges.length === 0) {
    return <p className="text-[9px] text-slate-500">Aucune dépendance inter-nœuds enregistrée.</p>;
  }
  return (
    <ul className="max-h-32 space-y-1 overflow-auto text-[8px]" data-testid="economic-dependencies">
      {props.edges.map((e) => (
        <li key={e.id} className="rounded border border-slate-800 px-2 py-0.5 font-mono text-slate-400">
          {e.dependencyType} · {e.correlationStrength} · stress {e.sharedOperationalStress}
        </li>
      ))}
    </ul>
  );
}
