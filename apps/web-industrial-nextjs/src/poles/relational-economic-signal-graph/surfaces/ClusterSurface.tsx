"use client";

import type { RelationalEconomicClusterListDto } from "@venext/shared-contracts";

export function ClusterSurface(props: { clusters: RelationalEconomicClusterListDto | null }) {
  const list = props.clusters?.clusters ?? [];
  if (!props.clusters) return <p className="text-[9px] text-slate-500">Clusters en cours…</p>;
  if (list.length === 0) return <p className="text-[9px] text-slate-500">Aucun cluster opérationnel détecté.</p>;
  return (
    <ul className="space-y-2 text-[9px]" data-testid="economic-clusters">
      {list.map((c) => (
        <li key={c.clusterCode} className="rounded border border-slate-800 px-2 py-1">
          <p className="font-mono text-amber-200/80">{c.clusterCode}</p>
          <p className="text-slate-500">
            Risque {c.clusterRisk} · score {c.clusterScore} · {c.corridorCount} corridor(s)
          </p>
        </li>
      ))}
    </ul>
  );
}
