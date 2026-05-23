import type { GeoEconomicOverviewDto } from "@venext/shared-contracts";

export function GeoEconomicOverviewSurface(props: { overview: GeoEconomicOverviewDto | null }) {
  const o = props.overview;
  if (!o) {
    return (
      <p className="text-[9px] text-amber-100/50" data-testid="geo-economic-overview-empty">
        Synthèse territoriale indisponible — indexez des corridors pour agréger les bassins observés.
      </p>
    );
  }
  return (
    <div
      className="rounded border border-amber-800/45 bg-amber-950/30 px-2 py-2"
      data-testid="geo-economic-overview-surface"
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Vue d’ensemble territoriale</p>
      <p className="mt-1 text-[9px] text-amber-100/75">{o.dominantTerritorialNarrative}</p>
      <dl className="mt-2 grid grid-cols-2 gap-1 font-mono text-[8px] text-amber-50/85">
        <div>
          <dt className="text-amber-200/60">Zones</dt>
          <dd>{o.zoneCount}</dd>
        </div>
        <div>
          <dt className="text-amber-200/60">Pression moy.</dt>
          <dd>{o.averagePressureScore}</dd>
        </div>
        <div>
          <dt className="text-amber-200/60">Densité moy.</dt>
          <dd>{o.averageDensityScore}</dd>
        </div>
      </dl>
    </div>
  );
}
