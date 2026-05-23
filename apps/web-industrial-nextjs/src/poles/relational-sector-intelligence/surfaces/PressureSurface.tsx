import type { SectorPressureOverviewDto } from "@venext/shared-contracts";

export function PressureSurface(props: { data: SectorPressureOverviewDto | null }) {
  const { data } = props;
  if (!data) {
    return (
      <div className="rounded border border-amber-900/35 bg-amber-950/20 p-2">
        <p className="text-[9px] text-amber-100/50">Pression sectorielle indisponible.</p>
      </div>
    );
  }
  return (
    <div className="rounded border border-amber-800/45 bg-amber-950/25 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Pression</p>
      <p className="mt-1 font-mono text-[8px] text-amber-100/65">cumul corridor {data.cumulative}</p>
      <ul className="mt-1 space-y-0.5 text-[8px] text-amber-100/70">
        {data.pressureBands.slice(0, 8).map((b) => (
          <li key={b.sectorSlug}>
            <span className="font-mono">{b.sectorSlug}</span> {b.pressureLevel} ({b.score})
          </li>
        ))}
      </ul>
    </div>
  );
}
