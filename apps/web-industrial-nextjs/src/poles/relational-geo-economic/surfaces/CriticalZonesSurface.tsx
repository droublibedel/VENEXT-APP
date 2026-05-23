import type { GeoEconomicCriticalZonesDto } from "@venext/shared-contracts";

export function CriticalZonesSurface(props: { critical: GeoEconomicCriticalZonesDto | null }) {
  const c = props.critical;
  if (!c || c.zones.length === 0) {
    return <p className="text-[9px] text-amber-100/50">Aucune zone critique au seuil analytique courant.</p>;
  }
  return (
    <div className="rounded border border-amber-600/50 bg-amber-950/35 px-2 py-2" data-testid="geo-critical-zones-surface">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-100">Zones critiques (lecture)</p>
      <ul className="mt-1 space-y-0.5 font-mono text-[7px] text-amber-50/85">
        {c.zones.map((z) => (
          <li key={z.id}>
            {z.zoneName} — pression {z.economicPressureScore} / fragilité {z.fragilityScore}
          </li>
        ))}
      </ul>
    </div>
  );
}
