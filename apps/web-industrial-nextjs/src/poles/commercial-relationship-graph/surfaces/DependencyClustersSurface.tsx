"use client";

import type { CommercialDependencyCluster } from "@venext/shared-contracts";

export function DependencyClustersSurface(props: { clusters: CommercialDependencyCluster[] }) {
  const rows = props.clusters.slice(0, 20);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="crg-clusters-surface">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Amas de dépendance</h3>
      <ul className="flex max-h-[200px] flex-col gap-1.5 overflow-auto pr-1">
        {rows.map((c) => (
          <li key={c.clusterId} className="rounded border border-slate-800/80 bg-black/35 px-2 py-1.5 text-[10px]">
            <p className="font-mono text-[9px] text-rose-200/85">{c.clusterType}</p>
            <p className="text-slate-300">
              dépendance {c.dependencyScore.toFixed(2)} · fragilité {c.fragilityScore.toFixed(2)}
            </p>
            <p className="mt-1 text-[9px] text-slate-500">{c.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
