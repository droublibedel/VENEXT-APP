import type { GeoEconomicPressureDto } from "@venext/shared-contracts";

export function PressureMapSurface(props: { pressure: GeoEconomicPressureDto | null }) {
  const p = props.pressure;
  if (!p) {
    return <p className="text-[9px] text-amber-100/50">Carte pression régionale indisponible.</p>;
  }
  return (
    <div className="rounded border border-amber-800/40 bg-slate-950/80 px-2 py-2" data-testid="geo-pressure-map-surface">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Pression territoriale</p>
      <p className="mt-1 font-mono text-[8px] text-amber-50/80">Niveau: {p.pressureLevel}</p>
      <p className="mt-1 text-[8px] text-amber-100/70">Saturation régionale: {p.regionalSaturationScore}</p>
      <p className="text-[8px] text-amber-100/70">Saturation opérationnelle: {p.operationalSaturationScore}</p>
      {p.diagnostics.slice(0, 4).map((d) => (
        <p key={d} className="mt-0.5 font-mono text-[7px] text-amber-200/55">
          {d}
        </p>
      ))}
    </div>
  );
}
