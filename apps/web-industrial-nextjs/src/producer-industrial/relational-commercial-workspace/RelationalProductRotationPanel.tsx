"use client";

import { memo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import type { RelationalCommercialWorkspaceView } from "./relational-commercial-workspace.types";
import { RelationalPanelFrame } from "./RelationalPanelFrame";

function ProductRotationPanelInner(props: {
  view: RelationalCommercialWorkspaceView | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
}) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const products = view?.products ?? [];

  return (
    <RelationalPanelFrame
      title="Rotation produits"
      subtitle="Momentum, pression demande et vitesse de rotation"
      loading={loading}
      error={error}
      empty={!products.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="relational-product-rotation-panel"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {products.map((p) => (
          <article
            key={p.id}
            className="rounded-lg border border-slate-800/70 bg-gradient-to-br from-slate-950/80 to-slate-900/40 px-3 py-3"
          >
            <p className="text-sm font-medium text-slate-100">{p.name}</p>
            <p className="text-[10px] text-slate-500">{p.category}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <span
                className={
                  p.momentum === "rising"
                    ? "text-emerald-400"
                    : p.momentum === "cooling"
                      ? "text-slate-500"
                      : "text-slate-300"
                }
              >
                {p.momentum === "rising" ? "Accélère" : p.momentum === "cooling" ? "Ralentit" : "Stable"}
              </span>
              <span className="text-slate-500">· Pression {p.demandPressure}%</span>
              <span className="text-violet-300/90">· Rotation {p.rotation}</span>
            </div>
          </article>
        ))}
      </div>
    </RelationalPanelFrame>
  );
}

export const RelationalProductRotationPanel = memo(ProductRotationPanelInner);
