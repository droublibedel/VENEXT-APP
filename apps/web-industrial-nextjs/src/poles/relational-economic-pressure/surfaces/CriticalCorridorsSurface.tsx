"use client";

import type { CriticalCorridorDto } from "@venext/shared-contracts";

export function CriticalCorridorsSurface(props: { corridors: CriticalCorridorDto[] }) {
  if (!props.corridors.length) {
    return <p className="text-[8px] text-slate-600">Aucun corridor critique listé pour cette organisation.</p>;
  }
  return (
    <ul className="space-y-1 font-mono text-[8px] text-rose-100/90" data-testid="pressure-critical-corridors">
      {props.corridors.map((c) => (
        <li key={c.relationshipId}>
          {c.severity} · pression {c.pressureScore} · exposition effondrement {(c.collapseExposure * 100).toFixed(0)}% ·{" "}
          {c.relationshipId.slice(0, 8)}…
        </li>
      ))}
    </ul>
  );
}
