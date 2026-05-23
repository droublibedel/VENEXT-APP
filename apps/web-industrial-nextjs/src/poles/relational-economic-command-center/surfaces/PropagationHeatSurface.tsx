"use client";

import type { RelationalEconomicSystemicViewDto } from "@venext/shared-contracts";

export function PropagationHeatSurface(props: { systemic: RelationalEconomicSystemicViewDto | null }) {
  const heat = props.systemic?.propagationHeat ?? null;
  if (heat === null) return <p className="text-[8px] text-slate-600">Propagation non résolue.</p>;
  return (
    <div className="rounded border border-orange-950/45 bg-orange-950/10 px-3 py-2" data-testid="relational-command-propagation-heat">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-100/85">Flux propagation</p>
      <p className="mt-2 font-mono text-2xl text-orange-50">{heat}</p>
      <p className="mt-1 text-[8px] text-slate-500">
        Agrégé déterministe depuis le graphe de signaux corridor — exposition moyenne, pas géolocalisation ni tracking partenaires.
      </p>
    </div>
  );
}
