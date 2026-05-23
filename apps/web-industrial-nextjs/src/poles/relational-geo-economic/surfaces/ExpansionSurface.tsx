import type { GeoEconomicExpansionOverviewDto } from "@venext/shared-contracts";

export function ExpansionSurface(props: { expansion: GeoEconomicExpansionOverviewDto | null }) {
  const e = props.expansion;
  if (!e) return <p className="text-[9px] text-amber-100/50">Projection expansion indisponible.</p>;
  return (
    <div className="rounded border border-amber-700/35 bg-amber-950/20 px-2 py-2" data-testid="geo-expansion-surface">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Potentiel d’expansion</p>
      <p className="mt-1 text-[8px] text-amber-100/75">{e.narrative}</p>
      <ul className="mt-1 space-y-0.5 font-mono text-[7px] text-amber-50/80">
        {e.rankedZones.slice(0, 6).map((z) => (
          <li key={z.id}>
            {z.zoneCode} — exp {z.expansionPotentialScore} / dens {z.operationalDensityScore}
          </li>
        ))}
      </ul>
    </div>
  );
}
