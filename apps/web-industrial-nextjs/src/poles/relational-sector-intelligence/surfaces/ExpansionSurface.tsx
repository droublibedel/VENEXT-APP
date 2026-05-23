import type { SectorExpansionOpportunitiesDto } from "@venext/shared-contracts";

export function ExpansionSurface(props: { data: SectorExpansionOpportunitiesDto | null }) {
  const { data } = props;
  if (!data) {
    return (
      <div className="rounded border border-amber-900/35 bg-amber-950/20 p-2">
        <p className="text-[9px] text-amber-100/50">Lecture expansion indisponible.</p>
      </div>
    );
  }
  return (
    <div className="rounded border border-amber-800/45 bg-amber-950/25 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Expansion analytique</p>
      <ul className="mt-1 space-y-1 text-[8px] text-amber-100/70">
        {data.opportunities.slice(0, 6).map((o) => (
          <li key={o.sectorSlug}>
            <span className="font-mono text-amber-200/80">{o.sectorSlug}</span> — score {o.score}
          </li>
        ))}
      </ul>
    </div>
  );
}
