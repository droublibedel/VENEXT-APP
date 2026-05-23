"use client";

import type { RelationalEconomicSystemicViewDto } from "@venext/shared-contracts";

export function StrategicPressureSurface(props: { systemic: RelationalEconomicSystemicViewDto | null }) {
  const s = props.systemic;
  if (!s) return <p className="text-[8px] text-slate-600">Vue stratégique indisponible.</p>;

  const zones =
    s.systemicPressureZones.length > 0
      ? s.systemicPressureZones
      : ["Aucune zone hors seuil (>65 exposition graphe corridor)"];

  return (
    <div className="space-y-3" data-testid="relational-command-strategic-pressure">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Motifs incidents dominants</p>
        <ul className="mt-1 list-inside list-disc text-[8px] text-slate-300">
          {s.dominantFailurePatterns.slice(0, 6).map((p) => (
            <li key={p}>{p}</li>
          ))}
          {!s.dominantFailurePatterns.length ? <li className="text-slate-600">Aucune alerte ouverte corrélée</li> : null}
        </ul>
      </div>
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-200/85">Zones de pression (corridor id)</p>
        <ul className="mt-1 max-h-24 overflow-auto font-mono text-[8px] text-slate-400">
          {zones.map((z, idx) => (
            <li key={`${z}-${idx}`} className="truncate font-mono text-[8px] text-slate-400">
              {z}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
