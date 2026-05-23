import type { SectorOverviewDto } from "@venext/shared-contracts";

export function SectorOverviewSurface(props: { overview: SectorOverviewDto | null }) {
  const { overview } = props;
  if (!overview) {
    return (
      <div className="rounded border border-amber-900/35 bg-amber-950/20 p-2">
        <p className="text-[9px] text-amber-100/50">Aucun agrégat sectoriel corridor.</p>
      </div>
    );
  }
  return (
    <div className="rounded border border-amber-800/45 bg-amber-950/25 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Vue sectorielle</p>
      <p className="mt-1 text-[9px] text-amber-100/70">{overview.narrative.slice(0, 420)}</p>
      <p className="mt-1 font-mono text-[8px] text-amber-200/60">noeuds={overview.nodes.length}</p>
    </div>
  );
}
