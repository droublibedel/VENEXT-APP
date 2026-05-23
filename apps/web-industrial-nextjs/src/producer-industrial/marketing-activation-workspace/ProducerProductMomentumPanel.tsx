"use client";

import { memo } from "react";

import type { MarketingPanelProps, ProducerMarketingWorkspaceView } from "./producer-marketing.types";
import { ProducerMarketingPanelFrame } from "./ProducerMarketingPanelFrame";

function ProductMomentumInner(
  props: MarketingPanelProps & { view: ProducerMarketingWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const rows = view?.productMomentum ?? [];

  return (
    <ProducerMarketingPanelFrame
      title="Momentum produits"
      subtitle="Produits qui accélèrent, ralentissements et pics d'activité"
      loading={loading}
      error={error}
      empty={!rows.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-product-momentum-panel"
    >
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2"
            data-testid={`marketing-product-${r.id}`}
          >
            <div>
              <p className="text-sm font-medium text-slate-100">{r.product}</p>
              <p className="text-[10px] text-slate-500">{r.category}</p>
            </div>
            <div className="text-right text-[11px]">
              <p className="capitalize text-emerald-400/90">{r.momentum}</p>
              <p className="font-mono text-slate-400">Demande {r.demandPressure}%</p>
              <p className="capitalize text-slate-500">{r.status}</p>
            </div>
          </li>
        ))}
      </ul>
    </ProducerMarketingPanelFrame>
  );
}

export const ProducerProductMomentumPanel = memo(ProductMomentumInner);
