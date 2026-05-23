"use client";

import type { PropagationMapDto } from "@venext/shared-contracts";

export function ContagionSurface(props: { map: PropagationMapDto | null }) {
  const m = props.map;
  if (!m?.paths.length) {
    return <p className="text-[8px] text-slate-600">Projection contagion bornée — pas de chaîne résolue.</p>;
  }
  return (
    <div data-testid="contagion-surface" className="font-mono text-[8px] text-orange-200/90">
      <p>Intensité propagation {m.intensity}</p>
      <p className="text-slate-500">{m.paths.length} chaînes corridor (BFS déterministe, profondeur plafonnée).</p>
    </div>
  );
}
