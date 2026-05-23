import type { GeoEconomicClusterDto } from "@venext/shared-contracts";

export function ClusterSurface(props: { clusters: GeoEconomicClusterDto[] }) {
  if (props.clusters.length === 0) {
    return <p className="text-[9px] text-amber-100/50">Aucun agrégat cluster territorial dérivé.</p>;
  }
  return (
    <div className="rounded border border-amber-800/35 bg-slate-950/70 px-2 py-2" data-testid="geo-cluster-surface">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Clusters régionaux</p>
      <ul className="mt-1 space-y-1 text-[8px] text-amber-100/75">
        {props.clusters.map((c) => (
          <li key={c.clusterCode} className="rounded border border-amber-900/25 bg-amber-950/20 px-1.5 py-1">
            <p className="font-mono text-[7px] text-amber-50/85">{c.clusterCode}</p>
            <p className="text-[7px] text-amber-100/70">{c.narrative}</p>
            <p className="font-mono text-[7px] text-amber-200/60">intensité {c.clusterIntensity}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
