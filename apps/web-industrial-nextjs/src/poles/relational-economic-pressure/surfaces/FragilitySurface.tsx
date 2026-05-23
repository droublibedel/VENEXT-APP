"use client";

import type { FragilityZonesDto } from "@venext/shared-contracts";

export function FragilitySurface(props: { zones: FragilityZonesDto | null }) {
  const z = props.zones?.zones ?? [];
  if (!z.length) {
    return <p className="text-[8px] text-slate-600">Aucune zone de fragilité agrégée au-delà des seuils.</p>;
  }
  return (
    <ul className="space-y-2 text-[8px] text-amber-100/85" data-testid="fragility-surface">
      {z.map((zone) => (
        <li key={zone.zoneCode} className="rounded border border-amber-900/35 bg-amber-950/15 px-2 py-1">
          <p className="font-mono text-[9px] text-amber-200">{zone.zoneCode}</p>
          <p className="text-slate-400">{zone.narrative}</p>
          <p className="font-mono text-[8px] text-slate-500">
            corridors {zone.corridorCount} · score {zone.fragilityScore}
          </p>
        </li>
      ))}
    </ul>
  );
}
