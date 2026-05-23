import type { MarketStructureOverviewDto } from "@venext/shared-contracts";

export function MarketStructureSurface(props: { data: MarketStructureOverviewDto | null }) {
  const { data } = props;
  if (!data) {
    return (
      <div className="rounded border border-amber-900/35 bg-amber-950/20 p-2">
        <p className="text-[9px] text-amber-100/50">Structure de marché indisponible.</p>
      </div>
    );
  }
  const v = data.vector;
  return (
    <div className="rounded border border-amber-800/45 bg-amber-950/25 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Structure de marché</p>
      <p className="mt-1 font-mono text-[8px] text-amber-100/65">{data.marketStructureType}</p>
      <ul className="mt-1 grid grid-cols-2 gap-1 font-mono text-[8px] text-amber-100/55">
        <li>concentration {v.sectorConcentration}</li>
        <li>saturation {v.corridorSaturation}</li>
        <li>dominance {v.sectorDominance}</li>
        <li>oligopole {v.oligopolyRisk}</li>
        <li>fragilité {v.marketFragility}</li>
        <li>diversification {v.diversificationGap}</li>
      </ul>
    </div>
  );
}
