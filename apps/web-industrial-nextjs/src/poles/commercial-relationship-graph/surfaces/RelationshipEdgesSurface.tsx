"use client";

import type { CommercialRelationshipEdge } from "@venext/shared-contracts";

export function RelationshipEdgesSurface(props: { edges: CommercialRelationshipEdge[] }) {
  const rows = props.edges.slice(0, 40);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="crg-edges-surface">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Arêtes relationnelles</h3>
      <ul className="flex max-h-[220px] flex-col gap-1.5 overflow-auto pr-1">
        {rows.map((e) => (
          <li key={e.relationshipId} className="rounded border border-slate-800/80 bg-black/35 px-2 py-1.5 text-[10px]">
            <p className="font-mono text-[9px] text-violet-200/85">{e.relationshipId}</p>
            <p className="text-slate-300">
              {e.relationshipType} · force {e.relationshipStrength.toFixed(2)} · dépendance {e.dependencyLevel.toFixed(2)}
            </p>
            <p className="mt-0.5 text-[9px] text-slate-500">
              {e.upstreamOrganizationId} → {e.downstreamOrganizationId}
            </p>
            <p className="mt-1 text-[9px] leading-snug text-slate-500">{e.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
