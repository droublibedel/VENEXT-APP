"use client";

import { memo } from "react";

import type { CatalogPanelProps, ProducerCatalogWorkspaceView } from "./producer-catalog.types";
import { ProducerCatalogPanelFrame } from "./ProducerCatalogPanelFrame";

function ProductRecommendationsInner(
  props: CatalogPanelProps & { view: ProducerCatalogWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerCatalogPanelFrame
      title="Recommandations réseau"
      subtitle="Actions suggérées — règles métier déterministes"
      loading={loading}
      error={error}
      empty={!view?.recommendations.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-product-recommendations-panel"
    >
      <ul className="space-y-2">
        {view?.recommendations.map((r) => (
          <li
            key={r.id}
            className={`rounded border-l-2 px-3 py-2 text-sm ${
              r.priority === "high"
                ? "border-emerald-500/60 bg-emerald-950/15 text-emerald-50"
                : r.priority === "medium"
                  ? "border-slate-500/40 bg-slate-950/30 text-slate-200"
                  : "border-slate-700/40 text-slate-400"
            }`}
            data-testid={`catalog-recommendation-${r.id}`}
          >
            {r.text}
          </li>
        ))}
      </ul>
    </ProducerCatalogPanelFrame>
  );
}

export const ProducerProductRecommendationsPanel = memo(ProductRecommendationsInner);
