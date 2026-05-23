"use client";

import { memo } from "react";

import type { CatalogPanelProps, ProducerCatalogWorkspaceView } from "./producer-catalog.types";
import { ProducerCatalogPanelFrame } from "./ProducerCatalogPanelFrame";

function InventoryRotationInner(
  props: CatalogPanelProps & { view: ProducerCatalogWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerCatalogPanelFrame
      title="Rotation stock"
      subtitle="Rapide, lente, stable et produits dormants"
      loading={loading}
      error={error}
      empty={!view?.rotationBuckets.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-inventory-rotation-panel"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {view?.rotationBuckets.map((b) => (
          <article key={b.id} className="rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase text-slate-500">{b.label}</p>
            <p className="mt-1 font-mono text-2xl text-slate-100">{b.count}</p>
            {b.examples.length ? (
              <p className="mt-2 text-[11px] text-slate-400">{b.examples.join(" · ")}</p>
            ) : (
              <p className="mt-2 text-[11px] text-slate-600">—</p>
            )}
          </article>
        ))}
      </div>
    </ProducerCatalogPanelFrame>
  );
}

export const ProducerInventoryRotationPanel = memo(InventoryRotationInner);
