import type { SystemicSectorRiskDto } from "@venext/shared-contracts";

export function SystemicRiskSurface(props: { data: SystemicSectorRiskDto | null }) {
  const { data } = props;
  if (!data) {
    return (
      <div className="rounded border border-amber-900/35 bg-amber-950/20 p-2">
        <p className="text-[9px] text-amber-100/50">Risque systémique sectoriel indisponible.</p>
      </div>
    );
  }
  return (
    <div className="rounded border border-amber-800/45 bg-amber-950/25 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Risque systémique</p>
      <p className="mt-1 font-mono text-[8px] text-amber-100/65">score {data.riskScore}</p>
      <ul className="mt-1 space-y-0.5 font-mono text-[7px] text-amber-100/55">
        {data.drivers.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </div>
  );
}
