"use client";

import { memo } from "react";

import type { FinancePanelProps, ProducerFinanceWorkspaceView } from "./producer-finance.types";
import { ProducerFinancePanelFrame } from "./ProducerFinancePanelFrame";

function FinanceOverviewInner(props: FinancePanelProps & { view: ProducerFinanceWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerFinancePanelFrame
      title="Vue finance"
      subtitle="Encaissements, stabilité et partenaires du réseau"
      loading={loading}
      error={error}
      empty={!view?.overview.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-finance-overview-panel"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {view?.overview.map((m) => (
          <article
            key={m.id}
            className={`rounded-lg border px-3 py-3 ${
              m.tone === "caution"
                ? "border-amber-500/30 bg-amber-950/15"
                : m.tone === "signal"
                  ? "border-emerald-500/25 bg-emerald-950/12"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-1 font-mono text-xl text-slate-100">{m.value}</p>
          </article>
        ))}
      </div>
    </ProducerFinancePanelFrame>
  );
}

export const ProducerFinanceOverviewPanel = memo(FinanceOverviewInner);
