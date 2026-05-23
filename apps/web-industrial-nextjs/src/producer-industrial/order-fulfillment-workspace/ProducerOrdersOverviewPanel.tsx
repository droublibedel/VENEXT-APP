"use client";

import { memo, useRef, useState } from "react";

import type { FulfillmentPanelProps, ProducerOrderFulfillmentView } from "./producer-order-fulfillment.types";
import { ProducerFulfillmentPanelFrame } from "./ProducerFulfillmentPanelFrame";

const ROW_H = 40;
const VISIBLE = 7;

function VirtualOrderTable(props: { rows: ProducerOrderFulfillmentView["orderRows"] }) {
  const { rows } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.floor(scrollTop / ROW_H);
  const slice = rows.slice(start, start + VISIBLE + 2);
  const offset = start * ROW_H;

  return (
    <div
      ref={ref}
      className="mt-4 max-h-[300px] overflow-y-auto rounded border border-slate-800/60"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      data-testid="fulfillment-orders-virtual-list"
    >
      <div style={{ height: rows.length * ROW_H, position: "relative" }}>
        <table className="absolute w-full text-[11px]" style={{ top: offset }}>
          <thead className="sticky top-0 bg-slate-950/95 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left">Réf.</th>
              <th className="px-2 py-2 text-left">Partenaire</th>
              <th className="px-2 py-2 text-left">Ville</th>
              <th className="px-2 py-2 text-left">Statut</th>
              <th className="px-2 py-2 text-left">Corridor</th>
              <th className="px-2 py-2 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="border-t border-slate-800/50 text-slate-300" style={{ height: ROW_H }}>
                <td className="px-2 py-1 font-mono text-slate-400">{row.reference}</td>
                <td className="px-2 py-1">{row.partner}</td>
                <td className="px-2 py-1">{row.city}</td>
                <td
                  className={
                    row.priority === "critique"
                      ? "px-2 py-1 text-rose-400"
                      : row.priority === "warning"
                        ? "px-2 py-1 text-amber-400"
                        : "px-2 py-1"
                  }
                >
                  {row.status}
                </td>
                <td className="px-2 py-1 text-slate-500">{row.corridor}</td>
                <td className="px-2 py-1 text-right font-mono">{row.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersOverviewInner(
  props: FulfillmentPanelProps & { view: ProducerOrderFulfillmentView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const buckets = view?.orderBuckets ?? [];

  return (
    <ProducerFulfillmentPanelFrame
      title="Vue commandes"
      subtitle="Actives, critiques, ralenties et terminées — lecture réseau"
      loading={loading}
      error={error}
      empty={!buckets.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-orders-overview-panel"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {buckets.map((b) => (
          <article
            key={b.id}
            className={`rounded-lg border px-3 py-3 ${
              b.tone === "caution"
                ? "border-amber-500/30 bg-amber-950/15"
                : b.tone === "signal"
                  ? "border-emerald-500/25 bg-emerald-950/12"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{b.label}</p>
            <p className="mt-1 font-mono text-xl text-slate-100">{b.count.toLocaleString("fr-FR")}</p>
            <p className="mt-1 text-[10px] text-slate-400">
              Stabilité {b.stability}% · {b.trend}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-600">{b.zones.join(" · ")}</p>
          </article>
        ))}
      </div>
      {view?.orderRows.length ? <VirtualOrderTable rows={view.orderRows} /> : null}
    </ProducerFulfillmentPanelFrame>
  );
}

export const ProducerOrdersOverviewPanel = memo(OrdersOverviewInner);
