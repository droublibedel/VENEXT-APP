"use client";

import type { DependencyMapDto } from "@venext/shared-contracts";

export function DependencyMapSurface(props: { map: DependencyMapDto | null }) {
  const m = props.map;
  if (!m?.nodes.length) {
    return <p className="text-[8px] text-slate-600">Carte dépendances vide — synchronisez le graphe corridor.</p>;
  }
  return (
    <div data-testid="dependency-map-surface" className="font-mono text-[8px] text-slate-400">
      <p>
        nœuds {m.nodes.length} · arêtes actives {m.edges.length} · corridor {m.relationshipId.slice(0, 8)}…
      </p>
    </div>
  );
}
