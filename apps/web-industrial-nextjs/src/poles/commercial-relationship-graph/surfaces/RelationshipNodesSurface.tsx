"use client";

import type { CommercialRelationshipNode } from "@venext/shared-contracts";

export function RelationshipNodesSurface(props: { nodes: CommercialRelationshipNode[] }) {
  const rows = props.nodes.slice(0, 48);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="crg-nodes-surface">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">Nœuds partenaires</h3>
      <ul className="flex max-h-[220px] flex-col gap-1.5 overflow-auto pr-1">
        {rows.map((n) => (
          <li key={n.organizationId} className="rounded border border-slate-800/80 bg-black/35 px-2 py-1.5 text-[10px]">
            <p className="font-medium text-slate-200">{n.displayName}</p>
            <p className="mt-0.5 font-mono text-[9px] text-slate-500">{n.organizationId}</p>
            <p className="mt-1 text-slate-400">
              rôle <span className="text-cyan-200/90">{n.nodeRole}</span> · arêtes {n.relationshipCount} · amont {n.upstreamCount}{" "}
              · aval {n.downstreamCount} · poids {n.commercialWeight.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
