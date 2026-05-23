"use client";

import { memo } from "react";

import type { MarketingPanelProps, ProducerMarketingWorkspaceView } from "./producer-marketing.types";
import { ProducerMarketingPanelFrame } from "./ProducerMarketingPanelFrame";

function MarketPressureInner(
  props: MarketingPanelProps & { view: ProducerMarketingWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const blocks = view?.pressure ?? [];
  const opportunities = view?.opportunities ?? [];

  return (
    <ProducerMarketingPanelFrame
      title="Pression marché"
      subtitle="Demande, tension produits et zones d'opportunité"
      loading={loading}
      error={error}
      empty={!blocks.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-market-pressure-panel"
    >
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {blocks.map((b) => (
          <article
            key={b.id}
            className={`rounded border px-3 py-2 ${
              b.tone === "caution"
                ? "border-amber-500/30 bg-amber-950/12"
                : b.tone === "signal"
                  ? "border-emerald-500/25 bg-emerald-950/10"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
          >
            <p className="text-[10px] uppercase text-slate-500">{b.label}</p>
            <p className="mt-1 font-mono text-lg text-slate-100">{b.value}</p>
          </article>
        ))}
      </div>
      <ul className="space-y-2" data-testid="marketing-opportunities-list">
        {opportunities.map((o) => (
          <li
            key={o.id}
            className="rounded border-l-2 border-emerald-500/40 bg-slate-950/30 px-3 py-2 text-sm text-slate-200"
            data-testid={`marketing-opportunity-${o.id}`}
          >
            {o.text}
          </li>
        ))}
      </ul>
    </ProducerMarketingPanelFrame>
  );
}

export const ProducerMarketPressurePanel = memo(MarketPressureInner);
