"use client";

import { memo } from "react";

import type { IntelligencePanelProps, ProducerIntelligenceWorkspaceView } from "./producer-intelligence.types";
import { ProducerIntelligencePanelFrame } from "./ProducerIntelligencePanelFrame";

function MarketAttentionInner(
  props: IntelligencePanelProps & { view: ProducerIntelligenceWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerIntelligencePanelFrame
      title="Attention marché"
      subtitle="Zones, produits et rythmes à garder en tête"
      loading={loading}
      error={error}
      empty={!view?.marketAttention.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-market-attention-panel"
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {view?.marketAttention.map((item) => (
          <li
            key={item.id}
            className={`rounded border px-3 py-2 ${
              item.tone === "caution"
                ? "border-amber-500/30 bg-amber-950/12"
                : item.tone === "signal"
                  ? "border-emerald-500/25 bg-emerald-950/10"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
            data-testid={`market-attention-${item.id}`}
          >
            <p className="text-sm font-medium text-slate-100">{item.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{item.detail}</p>
          </li>
        ))}
      </ul>
    </ProducerIntelligencePanelFrame>
  );
}

export const ProducerMarketAttentionPanel = memo(MarketAttentionInner);
