import type { DependencyMapOverviewDto } from "@venext/shared-contracts";

export function DependencySurface(props: { data: DependencyMapOverviewDto | null }) {
  const { data } = props;
  if (!data) {
    return (
      <div className="rounded border border-amber-900/35 bg-amber-950/20 p-2">
        <p className="text-[9px] text-amber-100/50">Graphe de dépendances sectorielles indisponible.</p>
      </div>
    );
  }
  return (
    <div className="rounded border border-amber-800/45 bg-amber-950/25 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">Dépendances</p>
      <p className="mt-1 font-mono text-[8px] text-amber-100/65">
        noeuds {data.nodes.length} — arêtes {data.edges.length}
      </p>
    </div>
  );
}
