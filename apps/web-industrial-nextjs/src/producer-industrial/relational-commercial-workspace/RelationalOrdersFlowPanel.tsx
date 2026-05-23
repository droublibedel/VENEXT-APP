"use client";

import { memo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import type { RelationalCommercialWorkspaceView } from "./relational-commercial-workspace.types";
import { RelationalPanelFrame } from "./RelationalPanelFrame";

function OrdersFlowPanelInner(props: {
  view: RelationalCommercialWorkspaceView | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
}) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <RelationalPanelFrame
      title="Flux commandes"
      subtitle="Commandes actives, corridors et demande terrain"
      loading={loading}
      error={error}
      empty={!view?.orderFlows.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="relational-orders-flow-panel"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {view?.orderFlows.map((card) => (
          <article
            key={card.id}
            className={`rounded-lg border px-3 py-3 ${
              card.tone === "caution"
                ? "border-amber-500/30 bg-amber-950/15"
                : card.tone === "signal"
                  ? "border-emerald-500/25 bg-emerald-950/15"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{card.title}</p>
            <p className="mt-1 text-xs text-slate-200">{card.detail}</p>
            {card.volume != null ? (
              <p className="mt-2 font-mono text-lg text-emerald-400/90">{card.volume.toLocaleString("fr-FR")}</p>
            ) : null}
          </article>
        ))}
      </div>
    </RelationalPanelFrame>
  );
}

export const RelationalOrdersFlowPanel = memo(OrdersFlowPanelInner);
