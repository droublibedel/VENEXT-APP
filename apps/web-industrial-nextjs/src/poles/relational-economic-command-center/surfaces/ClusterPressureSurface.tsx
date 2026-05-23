"use client";

import type { RelationalEconomicCommandCenterClusterListDto } from "@venext/shared-contracts";

export function ClusterPressureSurface(props: { clusters: RelationalEconomicCommandCenterClusterListDto | null }) {
  const { clusters } = props;
  if (!clusters?.clusters.length) {
    return <p className="text-[8px] text-slate-600">Aucun cluster opérationnel agrégé sous pression.</p>;
  }
  return (
    <ul className="space-y-1.5" data-testid="relational-command-cluster-pressure">
      {clusters.clusters.map((c) => (
        <li
          key={c.clusterCode}
          className="flex flex-wrap items-center justify-between gap-1 rounded border border-violet-900/35 bg-slate-950/70 px-2 py-1 font-mono text-[8px] text-slate-300"
        >
          <span className="truncate text-violet-200">{c.clusterCode}</span>
          <span className="text-[8px] text-slate-500">
            {c.severity} · {c.corridorCount} corridors · pression {c.pressureScore}
          </span>
        </li>
      ))}
    </ul>
  );
}
