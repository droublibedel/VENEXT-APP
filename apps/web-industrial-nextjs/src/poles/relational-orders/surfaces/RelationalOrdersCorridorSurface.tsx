"use client";

import type { RelationalOrderSnapshot } from "@venext/shared-contracts";

export function RelationalOrdersCorridorSurface(props: { orders: RelationalOrderSnapshot[] }) {
  const { orders } = props;
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-orders-corridor-list">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">File commandes corridor</h3>
      {orders.length === 0 ? (
        <p className="text-[10px] text-slate-500">Aucune commande dans le périmètre relationnel courant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => (
            <li key={o.orderId} className="rounded border border-slate-800/80 bg-black/30 px-2 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-cyan-100/90">{o.orderNumber}</span>
                <span className="font-mono text-[9px] text-slate-400">{o.orderStatus}</span>
              </div>
              <p className="mt-1 text-[9px] text-slate-500">
                relation <span className="font-mono">{o.relationshipId.slice(0, 8)}…</span> · lignes{" "}
                <span className="font-mono">{o.orderLines.length}</span>
              </p>
              <p className="mt-1 text-[8px] text-slate-600">{o.visibilityBoundary.slice(0, 160)}…</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
