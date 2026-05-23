"use client";

import { memo } from "react";

import type { FinancePanelProps, ProducerFinanceWorkspaceView } from "./producer-finance.types";
import { ProducerFinancePanelFrame } from "./ProducerFinancePanelFrame";

function FinanceCoverageInner(props: FinancePanelProps & { view: ProducerFinanceWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerFinancePanelFrame
      title="Couverture financière"
      subtitle="Réseau, zones et stabilité partenaires"
      loading={loading}
      error={error}
      empty={!view?.coverage.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-finance-coverage-panel"
    >
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {view?.coverage.map((b) => (
          <li
            key={b.id}
            className={`rounded border px-3 py-3 ${
              b.tone === "caution"
                ? "border-amber-500/30 bg-amber-950/12"
                : b.tone === "signal"
                  ? "border-emerald-500/25 bg-emerald-950/10"
                  : "border-slate-800/70 bg-slate-950/40"
            }`}
            data-testid={`finance-coverage-${b.id}`}
          >
            <p className="text-[10px] uppercase text-slate-500">{b.label}</p>
            <p className="mt-1 font-mono text-lg text-slate-100">{b.value}</p>
          </li>
        ))}
      </ul>
    </ProducerFinancePanelFrame>
  );
}

export const ProducerFinanceCoveragePanel = memo(FinanceCoverageInner);
