"use client";

import type { RelationalEconomicCriticalCorridorListDto } from "@venext/shared-contracts";

export function CriticalCorridorsSurface(props: { data: RelationalEconomicCriticalCorridorListDto | null }) {
  const { data } = props;
  if (!data?.corridors.length) {
    return (
      <p className="text-[8px] text-slate-600" data-testid="relational-command-critical-empty">
        Aucun corridor sous stress critique détecté avec les seuils déterministes courants.
      </p>
    );
  }
  return (
    <ul className="space-y-2" data-testid="relational-command-critical-list">
      {data.corridors.map((c) => (
        <li
          key={c.relationshipId}
          className="rounded border border-rose-950/50 bg-rose-950/15 px-2 py-1.5 font-mono text-[9px] text-rose-100/95"
        >
          <span className="text-rose-200">{c.severity}</span> · exposition {c.dependencyExposure} · pression {c.pressureScore} · prob. effondrement{" "}
          {(c.collapseProbability * 100).toFixed(0)}% — corridor {c.relationshipId.slice(0, 8)}…
        </li>
      ))}
    </ul>
  );
}
