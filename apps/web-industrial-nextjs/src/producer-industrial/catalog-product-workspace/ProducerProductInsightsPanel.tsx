"use client";

import { memo } from "react";

import type { CatalogPanelProps, ProducerCatalogWorkspaceView } from "./producer-catalog.types";
import { ProducerCatalogPanelFrame } from "./ProducerCatalogPanelFrame";

function ProductInsightsInner(
  props: CatalogPanelProps & { view: ProducerCatalogWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerCatalogPanelFrame
      title="Insights produits"
      subtitle="Lecture courte — produits, villes et opportunités"
      loading={loading}
      error={error}
      empty={!view?.insights.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-product-insights-panel"
    >
      <ul className="grid gap-2 md:grid-cols-2">
        {view?.insights.map((item) => (
          <li
            key={item.id}
            className={`rounded border px-3 py-2 ${
              item.priority === "high"
                ? "border-rose-500/30 bg-rose-950/15"
                : item.priority === "medium"
                  ? "border-amber-500/25 bg-amber-950/12"
                  : "border-slate-800/60 bg-slate-950/40"
            }`}
            data-testid={`catalog-insight-${item.id}`}
          >
            <p className="text-sm text-slate-100">{item.line1}</p>
            {item.line2 ? <p className="mt-0.5 text-[11px] text-slate-500">{item.line2}</p> : null}
          </li>
        ))}
      </ul>
    </ProducerCatalogPanelFrame>
  );
}

export const ProducerProductInsightsPanel = memo(ProductInsightsInner);
